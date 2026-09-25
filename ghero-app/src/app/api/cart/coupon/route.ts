import { handle, ok, parseBody } from "@/lib/api";
import { applyCouponSchema } from "@/lib/validations/cart";
import { applyCoupon, removeCoupon } from "@/lib/services/cart.service";

export const POST = handle(async (request: Request) => {
  const { code } = await parseBody(request, applyCouponSchema);
  return ok(await applyCoupon(code));
});

export const DELETE = handle(async () => ok(await removeCoupon()));
