import { z } from "zod";

/**
 * Address validation schemas.
 */
export const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().min(10).max(10).regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
  addressLine1: z.string().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200).optional(),
  area: z.string().min(1, "Area is required").max(100),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().length(6, "Pincode must be 6 digits").regex(/^[1-9][0-9]{5}$/, "Please enter a valid pincode"),
  country: z.string().default("India"),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
