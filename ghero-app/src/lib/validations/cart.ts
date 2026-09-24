import { z } from "zod";

/**
 * Cart validation schemas.
 */
export const addToCartSchema = z.object({
  variantId: z.string().min(1, "Variant is required"),
  quantity: z.number().int().positive("Quantity must be at least 1").max(10, "Maximum 10 items per variant"),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1").max(10, "Maximum 10 items per variant"),
});

export const removeCartItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase().trim(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
