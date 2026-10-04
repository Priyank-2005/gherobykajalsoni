import { ok, parseBody } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { quoteBillSchema } from "@/lib/validations/pos";
import { quoteBill } from "@/lib/services/pos-bill.service";

/** Price the current bill (coupon, discount limit, stock) without saving anything. */
export const POST = posRoute("CASHIER", async (session, request: Request) => {
  const input = await parseBody(request, quoteBillSchema);
  return ok({ quote: await quoteBill(session.staff, input) });
});
