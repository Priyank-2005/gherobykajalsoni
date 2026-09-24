import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "ghero_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate a cryptographically secure session ID.
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a 6-digit OTP.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP for secure storage.
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify an OTP against its hash.
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Create a session for a user and set the session cookie.
 */
export async function createSession(
  userId: string,
  request?: { headers: { get(name: string): string | null } }
) {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
      userAgent: request?.headers.get("user-agent") || null,
      ipAddress: request?.headers.get("x-forwarded-for") || null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return sessionId;
}

/**
 * Get the current session and user from the session cookie.
 * Returns null if no valid session exists.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } });
    const cs = await cookies();
    cs.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    sessionId: session.id,
    user: session.user,
  };
}

/**
 * Destroy the current session (logout).
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
      // Session may already be deleted
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/**
 * Require authentication. Returns the session or throws.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Require admin role. Returns the session or throws.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
