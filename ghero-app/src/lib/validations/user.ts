import { z } from "zod";

/**
 * User profile validation schemas.
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  phone: z.string().min(10).max(10).regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
