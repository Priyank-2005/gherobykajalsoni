import { z } from "zod";
import { httpUrl } from "./common";

/**
 * Order validation schemas for admin operations.
 */
export const updateOrderStatusSchema = z
  .object({
    status: z.enum(["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
    trackingUrl: httpUrl.optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.status !== "SHIPPED" || Boolean(data.trackingUrl), {
    message: "Tracking URL is required when marking an order as shipped",
    path: ["trackingUrl"],
  });

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
