import { z } from "zod";
import { addressSchema } from "./address";

/**
 * Auth validation schemas.
 */
export const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  // Sent by the checkout gate so brand-new accounts are created with the details already typed.
  name: z.string().trim().min(1).max(100).optional(),
  phone: addressSchema.shape.phone.optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
