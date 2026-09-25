import crypto from "crypto";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { forbidden, unauthorized } from "./api";

export const SESSION_COOKIE_NAME = "ghero_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const OTP_CONFIG = {
  length: 6,
  expiresInSeconds: 5 * 60,
  maxAttempts: 5,
  resendCooldownSeconds: 30,
  maxSendsPerHour: 5,
} as const;

/** SHA-256 hex digest. Used so raw session/cart tokens are never stored in the DB. */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Unguessable opaque token for cookies. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Generate a 6-digit OTP using a CSPRNG. */
export function generateOTP(): string {
  return crypto.randomInt(0, 10 ** OTP_CONFIG.length).toString().padStart(OTP_CONFIG.length, "0");
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Create a session and set the HTTP-only cookie.
 * Must be called from a Route Handler or Server Function (cookies can't be set while rendering).
 */
export async function createSession(userId: string, request?: Request) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      id: sha256(token),
      userId,
      expiresAt,
      userAgent: request?.headers.get("user-agent")?.slice(0, 500) || null,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
};

/**
 * Read the current session. Read-only: safe to call from Server Components.
 * Cached per request, so layout + page + services share one DB lookup.
 * Expired sessions return null; the row is pruned by the next logout/login.
 */
export const getSession = cache(async (): Promise<{ sessionId: string; user: SessionUser } | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true, role: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return { sessionId: session.id, user: session.user };
});

/** Destroy the current session (logout). Route Handler / Server Function only. */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: sha256(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Opportunistic cleanup of expired sessions for a user (called on login). */
export async function pruneExpiredSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
}

/** Require a signed-in user. Throws AppError(401). */
export async function requireAuth() {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}

/** Require an admin. Throws AppError(401/403). */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw forbidden();
  return session;
}
