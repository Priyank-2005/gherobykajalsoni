import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { supplierBarcodeSchema } from "@/lib/validations/pos";
import { addSupplierBarcode } from "@/lib/services/stock.service";

/** Link a supplier's barcode (EAN/UPC on bought-in stock) so the POS recognises it too. */
export const POST = adminRoute(async (request: Request, ctx: { params: Promise<{ id: string; variantId: string }> }) => {
  const { id, variantId } = await ctx.params;
  const { code } = await parseBody(request, supplierBarcodeSchema);
  return ok({ barcode: await addSupplierBarcode(id, variantId, code) }, { status: 201 });
});
