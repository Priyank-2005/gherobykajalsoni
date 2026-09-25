import { badRequest, ok } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { uploadPresets } from "@/lib/cloudinary";
import { uploadMedia, type UploadKind } from "@/lib/services/media.service";

/**
 * Multipart upload: fields `file` and `kind` (productImage | productVideo | categoryImage |
 * heroImage | heroMobileImage | reelMedia | testimonialImage). Returns { url, cloudinaryId },
 * which is then attached to a product/category/CMS item via its own endpoint.
 */
export const POST = adminRoute(async (request: Request) => {
  const form = await request.formData().catch(() => null);
  if (!form) throw badRequest("Expected multipart/form-data");
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  if (!(file instanceof File)) throw badRequest("Missing file");
  if (!(kind in uploadPresets)) throw badRequest("Invalid upload kind");
  return ok({ media: await uploadMedia(file, kind as UploadKind) }, { status: 201 });
});
