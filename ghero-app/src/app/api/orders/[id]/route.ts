import { handle, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getUserOrder } from "@/lib/services/order.service";

export const GET = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user } = await requireAuth();
  const { id } = await ctx.params;
  return ok({ order: await getUserOrder(user.id, id) });
});
