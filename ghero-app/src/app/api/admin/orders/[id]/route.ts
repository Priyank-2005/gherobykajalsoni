import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import { adminGetOrder, adminUpdateOrderStatus } from "@/lib/services/order.service";

type Ctx = { params: Promise<{ id: string }> };

/** Includes customer, admin notes and the statuses this order may move to next. */
export const GET = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return ok({ order: await adminGetOrder(id) });
});

/**
 * Change status (SHIPPED requires trackingUrl). Cancelling a paid order restocks it.
 * SHIPPED / DELIVERED trigger customer notifications.
 */
export const PATCH = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const input = await parseBody(request, updateOrderStatusSchema);
  return ok({ order: await adminUpdateOrderStatus(id, input) });
});
