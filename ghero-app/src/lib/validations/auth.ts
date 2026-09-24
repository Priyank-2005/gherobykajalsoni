import { z } from "zod";

/**
 * Auth validation schemas.
 */
export const sendOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
