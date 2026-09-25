import { badRequest, ok } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { deleteProductMedia } from "@/lib/services/product.service";
import { deleteMedia } from "@/lib/services/media.service";

/** DELETE ?kind=image|video */
export const DELETE = adminRoute(async (request: Request, ctx: { params: Promise<{ id: string; mediaId: string }> }) => {
  const { id, mediaId } = await ctx.params;
  const kind = new URL(request.url).searchParams.get("kind");
  if (kind !== "image" && kind !== "video") throw badRequest("kind must be image or video");
  await deleteMedia([await deleteProductMedia(id, kind, mediaId)]);
  return ok({ success: true });
});
