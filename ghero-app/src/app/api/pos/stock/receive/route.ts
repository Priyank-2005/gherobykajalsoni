import { ok, parseBody } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { receiveStockSchema } from "@/lib/validations/pos";
import { receiveStock } from "@/lib/services/stock.service";

/** New stock arrived (manager / owner). Shop and website both see the new count. */
export const POST = posRoute("MANAGER", async (session, request: Request) => {
  const { lines, note } = await parseBody(request, receiveStockSchema);
  return ok(await receiveStock(session.staff.id, lines, note), { status: 201 });
});
