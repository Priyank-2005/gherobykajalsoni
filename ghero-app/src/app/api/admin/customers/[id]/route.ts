import { ok } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { adminGetCustomer } from "@/lib/services/order.service";

/** Profile, saved addresses and full order history. */
export const GET = adminRoute(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  return ok({ customer: await adminGetCustomer(id) });
});
