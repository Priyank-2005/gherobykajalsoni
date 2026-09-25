import { handle, ok, parseBody, clientIp, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, pruneExpiredSessions } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { verifyOtpAndGetUser } from "@/lib/services/auth.service";
import { mergeGuestCart } from "@/lib/services/cart.service";

export const POST = handle(async (request: Request) => {
  if (!rateLimit({ key: `verify-ip:${clientIp(request)}`, limit: 30, windowSeconds: 900 }).success) {
    throw tooMany("Too many attempts. Please try again later.");
  }
  const { email, otp, name, phone } = await parseBody(request, verifyOtpSchema);
  const { user, isNewUser } = await verifyOtpAndGetUser(email, otp, { name, phone });

  await pruneExpiredSessions(user.id);
  await createSession(user.id, request);
  await mergeGuestCart(user.id);

  return ok({
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
    isNewUser,
  });
});
