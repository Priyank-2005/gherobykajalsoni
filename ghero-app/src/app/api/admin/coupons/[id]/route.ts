import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { updateCouponSchema } from "@/lib/validations/coupon";
import { deleteCoupon, updateCoupon } from "@/lib/services/coupon.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const input = await parseBody(request, updateCouponSchema);
  return ok({ coupon: await updateCoupon(id, input) });
});

/** Redeemed coupons are deactivated rather than deleted (keeps usage history). */
export const DELETE = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return ok(await deleteCoupon(id));
});
