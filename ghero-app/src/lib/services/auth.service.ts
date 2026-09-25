import { prisma } from "@/lib/db";
import { OTP_CONFIG, generateOTP, hashOTP, verifyOTP } from "@/lib/auth";
import { badRequest, tooMany } from "@/lib/api";
import { sendOtpEmail } from "./email.service";

/**
 * Email OTP authentication.
 * Limits are enforced from the DB (not memory) so they hold across server instances:
 * - resend cooldown between sends to the same email
 * - max sends per email per hour
 * - max verify attempts per code; codes are single-use and superseded by newer ones
 */

export async function sendOtp(email: string) {
  // Admin accounts sign in with email + password at /admin/login only; an emailed code
  // must never be a second way into an admin session.
  const admin = await prisma.user.findFirst({ where: { email, role: "ADMIN" }, select: { id: true } });
  if (admin) throw badRequest("This is an admin account. Please sign in at /admin/login.", "ADMIN_ACCOUNT");

  const now = Date.now();
  const recent = await prisma.otpVerification.findMany({
    where: { email, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const last = recent[0];
  if (last) {
    const waitMs = last.createdAt.getTime() + OTP_CONFIG.resendCooldownSeconds * 1000 - now;
    if (waitMs > 0) {
      throw tooMany(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting a new code`);
    }
  }
  if (recent.length >= OTP_CONFIG.maxSendsPerHour) {
    throw tooMany("Too many codes requested. Please try again in an hour.");
  }

  const otp = generateOTP();
  await prisma.$transaction([
    // Supersede any outstanding code so only the newest one works.
    prisma.otpVerification.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.otpVerification.create({
      data: {
        email,
        hashedOtp: await hashOTP(otp),
        expiresAt: new Date(now + OTP_CONFIG.expiresInSeconds * 1000),
      },
    }),
  ]);

  await sendOtpEmail(email, otp, OTP_CONFIG.expiresInSeconds / 60);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return {
    isNewUser: !existing,
    resendAfterSeconds: OTP_CONFIG.resendCooldownSeconds,
    expiresInSeconds: OTP_CONFIG.expiresInSeconds,
  };
}

/**
 * Check a code and consume it (single-use). Throws AppError with a customer-facing reason.
 */
export async function consumeOtp(email: string, otp: string) {
  const record = await prisma.otpVerification.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw badRequest("This code has expired. Please request a new one.", "OTP_EXPIRED");
  }
  if (record.attempts >= OTP_CONFIG.maxAttempts) {
    throw tooMany("Too many incorrect attempts. Please request a new code.");
  }

  const valid = await verifyOTP(otp, record.hashedOtp);
  if (!valid) {
    // Conditional increment so concurrent guesses can't exceed the limit.
    const updated = await prisma.otpVerification.updateMany({
      where: { id: record.id, attempts: { lt: OTP_CONFIG.maxAttempts } },
      data: { attempts: { increment: 1 } },
    });
    const remaining = OTP_CONFIG.maxAttempts - record.attempts - 1;
    if (updated.count === 0 || remaining <= 0) {
      throw tooMany("Too many incorrect attempts. Please request a new code.");
    }
    throw badRequest(`Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`, "OTP_INVALID");
  }

  // Consume atomically: if another request consumed it first, reject.
  const consumed = await prisma.otpVerification.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count === 0) {
    throw badRequest("This code has already been used. Please request a new one.", "OTP_USED");
  }
}

/**
 * Verify a sign-in code, then find or create the user. Checkout passes name/phone so new
 * accounts are created with them; existing accounts are recognised by email (no duplicates)
 * and only have blank fields filled in.
 */
export async function verifyOtpAndGetUser(
  email: string,
  otp: string,
  profile?: { name?: string; phone?: string }
) {
  await consumeOtp(email, otp);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.role === "ADMIN") throw badRequest("This is an admin account. Please sign in at /admin/login.", "ADMIN_ACCOUNT");
  if (existing) {
    const fill: { name?: string; phone?: string } = {};
    if (!existing.name && profile?.name) fill.name = profile.name;
    if (!existing.phone && profile?.phone) fill.phone = profile.phone;
    if (Object.keys(fill).length === 0) return { user: existing, isNewUser: false };
    return { user: await prisma.user.update({ where: { id: existing.id }, data: fill }), isNewUser: false };
  }

  const user = await prisma.user.create({
    data: { email, name: profile?.name || null, phone: profile?.phone || null },
  });
  return { user, isNewUser: true };
}
