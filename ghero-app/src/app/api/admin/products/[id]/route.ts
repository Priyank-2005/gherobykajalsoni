import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { updateProductSchema } from "@/lib/validations/product";
import { adminGetProduct, deleteProduct, updateProduct } from "@/lib/services/product.service";
import { deleteMedia } from "@/lib/services/media.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return ok({ product: await adminGetProduct(id) });
});

/** Partial update. Changing category without a subcategoryId clears the old subcategory. */
export const PUT = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const input = await parseBody(request, updateProductSchema);
  return ok({ product: await updateProduct(id, input) });
});

/** Permanent delete (orders keep their snapshots). Prefer unpublishing to archive. */
export const DELETE = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await deleteMedia(await deleteProduct(id));
  return ok({ success: true });
});
