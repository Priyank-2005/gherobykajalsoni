import { z } from "zod";

/**
 * Coupon validation schemas for admin CRUD operations.
 */
export const createCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(30).toUpperCase().trim()
    .regex(/^[A-Z0-9]+$/, "Coupon code must contain only letters and numbers"),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  applyOn: z.enum(["CART_VALUE", "MRP"]),
  discountValue: z.number().positive("Discount value must be positive"),
  maxDiscount: z.number().positive().optional().nullable(),
  minCartValue: z.number().min(0).optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().default(1),
  isActive: z.boolean().optional().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
}).refine(
  (data) => {
    // For percentage coupons, value must be between 1-100
    if (data.type === "PERCENTAGE" && (data.discountValue < 1 || data.discountValue > 100)) {
      return false;
    }
    return true;
  },
  {
    message: "Percentage discount must be between 1 and 100",
    path: ["discountValue"],
  }
);

export const updateCouponSchema = createCouponSchema.partial();

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
