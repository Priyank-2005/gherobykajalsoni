import { handle, ok, parseBody } from "@/lib/api";
import { updateCartItemSchema } from "@/lib/validations/cart";
import { updateItem } from "@/lib/services/cart.service";

export const PUT = handle(async (request: Request) => {
  const { itemId, quantity } = await parseBody(request, updateCartItemSchema);
  return ok(await updateItem(itemId, quantity));
});
