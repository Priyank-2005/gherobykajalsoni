import { ok, parseBody } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { cancelBillSchema } from "@/lib/validations/pos";
import { cancelBill } from "@/lib/services/pos-bill.service";

/** Cancel a bill made by mistake (manager, or cashier with a manager's PIN). Stock goes back. */
export const POST = posRoute("CASHIER", async (session, request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { reason, approval } = await parseBody(request, cancelBillSchema);
  return ok({ bill: await cancelBill(session, id, reason, approval) });
});
