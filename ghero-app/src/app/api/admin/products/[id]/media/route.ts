import { z } from "zod";
import { httpUrl } from "@/lib/validations/common";
import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { addProductMedia, reorderProductImages } from "@/lib/services/product.service";

type Ctx = { params: Promise<{ id: string }> };

const addSchema = z.object({
  kind: z.enum(["image", "video"]),
  url: httpUrl,
  cloudinaryId: z.string().min(1),
  alt: z.string().max(200).optional(),
  thumbnail: httpUrl.optional(),
});

/** Attach an uploaded asset (from POST /api/admin/media) to the product. */
export const POST = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { kind, ...media } = await parseBody(request, addSchema);
  return ok({ media: await addProductMedia(id, kind, media) }, { status: 201 });
});

const reorderSchema = z.object({ imageIds: z.array(z.string().min(1)).min(1) });

/** Reorder images; the first image is the product's cover. */
export const PUT = adminRoute(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { imageIds } = await parseBody(request, reorderSchema);
  await reorderProductImages(id, imageIds);
  return ok({ success: true });
});
