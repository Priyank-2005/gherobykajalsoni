import { ok } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { removeSupplierBarcode } from "@/lib/services/stock.service";

export const DELETE = adminRoute(async (_request: Request, ctx: { params: Promise<{ id: string; variantId: string; barcodeId: string }> }) => {
  const { id, variantId, barcodeId } = await ctx.params;
  await removeSupplierBarcode(id, variantId, barcodeId);
  return ok({ success: true });
});
