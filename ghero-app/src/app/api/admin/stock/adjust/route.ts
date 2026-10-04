import { handle, ok, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { adjustStockSchema } from "@/lib/validations/pos";
import { adjustStock } from "@/lib/services/stock.service";

/** Correct stock with a reason (damaged, gift, sample, lost, found …); logged in stock history. */
export const POST = handle(async (request: Request) => {
  const session = await requireAdmin();
  const input = await parseBody(request, adjustStockSchema);
  await adjustStock(session.user.id, input);
  return ok({ success: true });
});
