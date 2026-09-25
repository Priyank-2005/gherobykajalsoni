import { z } from "zod";
import { clientIp, handle, ok, parseBody, tooMany } from "@/lib/api";
import { createSession, pruneExpiredSessions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { verifyAdminCredentials } from "@/lib/services/admin-auth.service";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(200),
});

/** Admin panel sign-in (email + password; no OTP). Rate-limited per IP and per email. */
export const POST = handle(async (request: Request) => {
  const { email, password } = await parseBody(request, schema);
  const ipOk = rateLimit({ key: `admin-login-ip:${clientIp(request)}`, limit: 10, windowSeconds: 900 }).success;
  const emailOk = rateLimit({ key: `admin-login-email:${email}`, limit: 10, windowSeconds: 900 }).success;
  if (!ipOk || !emailOk) throw tooMany("Too many sign-in attempts. Please wait 15 minutes and try again.");

  const user = await verifyAdminCredentials(email, password);
  await pruneExpiredSessions(user.id);
  await createSession(user.id, request);
  return ok({ user });
});
