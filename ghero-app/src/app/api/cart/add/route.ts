import { handle, ok, parseBody } from "@/lib/api";
import { addToCartSchema } from "@/lib/validations/cart";
import { addItem } from "@/lib/services/cart.service";

export const POST = handle(async (request: Request) => {
  const { variantId, quantity } = await parseBody(request, addToCartSchema);
  return ok(await addItem(variantId, quantity));
});
