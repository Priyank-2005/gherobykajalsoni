import { z } from "zod";
import { addressSchema } from "./address";

/**
 * User profile validation schemas. Email changes go through a separate OTP flow.
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  phone: addressSchema.shape.phone.optional(),
});

export const requestEmailChangeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
});

export const confirmEmailChangeSchema = requestEmailChangeSchema.extend({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
