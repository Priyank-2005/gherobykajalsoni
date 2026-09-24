import { z } from "zod";

/**
 * Checkout validation schemas.
 */
export const checkoutSchema = z.object({
  // If user has saved addresses, they can select one
  addressId: z.string().optional(),

  // Or provide a new address
  address: z.object({
    fullName: z.string().min(1, "Full name is required").max(100),
    phone: z.string().min(10, "Phone number must be 10 digits").max(10).regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
    addressLine1: z.string().min(1, "Address is required").max(200),
    addressLine2: z.string().max(200).optional(),
    area: z.string().min(1, "Area is required").max(100),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    pincode: z.string().length(6, "Pincode must be 6 digits").regex(/^[1-9][0-9]{5}$/, "Please enter a valid pincode"),
    country: z.string().default("India"),
  }).optional(),
}).refine(
  (data) => data.addressId || data.address,
  { message: "Either select a saved address or provide a new one" }
);

export type CheckoutInput = z.infer<typeof checkoutSchema>;
