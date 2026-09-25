import { handle, ok, parseBody, clientIp, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { sendOtpSchema } from "@/lib/validations/auth";
import { sendOtp } from "@/lib/services/auth.service";

export const POST = handle(async (request: Request) => {
  // Per-email limits live in the DB (auth.service); this caps abuse from one IP across many emails.
  if (!rateLimit({ key: `otp-ip:${clientIp(request)}`, limit: 20, windowSeconds: 3600 }).success) {
    throw tooMany("Too many requests. Please try again later.");
  }
  const { email } = await parseBody(request, sendOtpSchema);
  return ok(await sendOtp(email));
});
