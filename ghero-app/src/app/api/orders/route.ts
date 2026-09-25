import { handle, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { listUserOrders } from "@/lib/services/order.service";

export const GET = handle(async () => {
  const { user } = await requireAuth();
  return ok({ orders: await listUserOrders(user.id) });
});
