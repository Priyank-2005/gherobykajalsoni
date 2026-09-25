import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { updateVariantSchema } from "@/lib/validations/product";
import { deleteVariant, updateVariant } from "@/lib/services/product.service";

type Ctx = { params: Promise<{ id: string; variantId: string }> };

/** Update SKU / size / colour / price / MRP / stock / availability. */
export const PUT = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id, variantId } = await ctx.params;
  const input = await parseBody(request, updateVariantSchema);
  return ok({ variant: await updateVariant(id, variantId, input) });
});

export const DELETE = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { id, variantId } = await ctx.params;
  await deleteVariant(id, variantId);
  return ok({ success: true });
});
