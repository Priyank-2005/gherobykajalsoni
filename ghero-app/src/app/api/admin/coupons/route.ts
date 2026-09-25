import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { createCouponSchema } from "@/lib/validations/coupon";
import { adminListCoupons, createCoupon } from "@/lib/services/coupon.service";

export const GET = adminRoute(async () => ok({ coupons: await adminListCoupons() }));

export const POST = adminRoute(async (request: Request) => {
  const input = await parseBody(request, createCouponSchema);
  return ok({ coupon: await createCoupon(input) }, { status: 201 });
});
