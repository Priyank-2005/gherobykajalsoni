import { z } from "zod";

/**
 * Coupon validation schemas for admin CRUD operations.
 * Zod 4 can't `.partial()` a refined schema, and applies `.default()` inside `.partial()`,
 * so updates derive from a default-free base and refinements are attached per schema.
 */
const couponBase = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Coupon code is required")
    .max(30)
    .regex(/^[A-Z0-9]+$/, "Coupon code must contain only letters and numbers"),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  applyOn: z.enum(["CART_VALUE", "MRP"]),
  discountValue: z.number().positive("Discount value must be positive"),
  maxDiscount: z.number().positive().optional().nullable(),
  minCartValue: z.number().min(0).optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().nullable(),
  isActive: z.boolean(),
  startsAt: z.iso.datetime({ offset: true }).optional().nullable(),
  expiresAt: z.iso.datetime({ offset: true }).optional().nullable(),
});

const percentageInRange = (d: { type?: string; discountValue?: number }) =>
  d.type !== "PERCENTAGE" || d.discountValue === undefined || (d.discountValue >= 1 && d.discountValue <= 100);

const datesInOrder = (d: { startsAt?: string | null; expiresAt?: string | null }) =>
  !d.startsAt || !d.expiresAt || new Date(d.startsAt) < new Date(d.expiresAt);

export const createCouponSchema = couponBase
  .extend({
    perUserLimit: couponBase.shape.perUserLimit.optional().default(1),
    isActive: z.boolean().default(true),
  })
  .refine(percentageInRange, { message: "Percentage discount must be between 1 and 100", path: ["discountValue"] })
  .refine(datesInOrder, { message: "Expiry must be after the start date", path: ["expiresAt"] });

export const updateCouponSchema = couponBase
  .partial()
  .refine(percentageInRange, { message: "Percentage discount must be between 1 and 100", path: ["discountValue"] })
  .refine(datesInOrder, { message: "Expiry must be after the start date", path: ["expiresAt"] });

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
