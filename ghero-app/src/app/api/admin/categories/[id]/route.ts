import { z } from "zod";
import { mediaSrc } from "@/lib/validations/common";
import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { updateCategorySchema } from "@/lib/validations/category";
import { deleteCategory, setCategoryImage, updateCategory } from "@/lib/services/category.service";
import { deleteMedia } from "@/lib/services/media.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Replace the category and its full subcategory list: rows with `id` are updated,
 * rows without are created, existing rows not in the list are deleted.
 */
export const PUT = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const input = await parseBody(request, updateCategorySchema);
  return ok({ category: await updateCategory(id, input) });
});

const imageSchema = z.object({
  image: z.object({ url: mediaSrc, cloudinaryId: z.string().min(1) }).nullable(),
});

/** Set/clear the category image (upload first via /api/admin/media). */
export const PATCH = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { image } = await parseBody(request, imageSchema);
  return ok({ category: await setCategoryImage(id, image) });
});

/** Only empty categories can be deleted; hide ones that still have products. */
export const DELETE = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { cloudinaryId } = await deleteCategory(id);
  await deleteMedia([cloudinaryId]);
  return ok({ success: true });
});
