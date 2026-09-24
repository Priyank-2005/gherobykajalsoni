import { z } from "zod";

/**
 * Order validation schemas for admin operations.
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  trackingUrl: z.string().url("Please enter a valid tracking URL").optional(),
}).refine(
  (data) => {
    // Tracking URL is mandatory when setting status to SHIPPED
    if (data.status === "SHIPPED" && !data.trackingUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Tracking URL is required when marking an order as shipped",
    path: ["trackingUrl"],
  }
);

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
