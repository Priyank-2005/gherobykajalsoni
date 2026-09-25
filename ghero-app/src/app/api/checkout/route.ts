import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { createOrderFromCart } from "@/lib/services/checkout.service";

/** Creates a PENDING_PAYMENT order from the signed-in user's bag. Next step: /api/payment/create-order. */
export const POST = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const input = await parseBody(request, checkoutSchema);
  return ok({ order: await createOrderFromCart(user, input) }, { status: 201 });
});
