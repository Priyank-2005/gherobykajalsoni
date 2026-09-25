import { z } from "zod";
import { addressSchema } from "./address";

/**
 * Checkout validation. Email is not taken from the form: the order uses the verified
 * email of the signed-in user (the OTP gate at checkout guarantees one).
 */
export const checkoutSchema = z
  .object({
    // Unique per checkout attempt (client generates once per page load); makes "Place order" retry-safe.
    idempotencyKey: z.string().min(16).max(100),
    // Either pick a saved address...
    addressId: z.string().optional(),
    // ...or provide a new one.
    address: addressSchema.omit({ isDefault: true }).optional(),
    saveAddress: z.boolean().optional().default(true),
  })
  .refine((data) => data.addressId || data.address, {
    message: "Please select a saved address or enter a new one",
    path: ["address"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
