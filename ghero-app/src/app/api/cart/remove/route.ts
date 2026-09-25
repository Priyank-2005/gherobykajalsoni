import { handle, ok, parseBody } from "@/lib/api";
import { removeCartItemSchema } from "@/lib/validations/cart";
import { removeItem } from "@/lib/services/cart.service";

export const DELETE = handle(async (request: Request) => {
  const { itemId } = await parseBody(request, removeCartItemSchema);
  return ok(await removeItem(itemId));
});
