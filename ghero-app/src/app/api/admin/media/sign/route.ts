import { z } from "zod";
import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { uploadPresets } from "@/lib/cloudinary";
import { signUpload, type UploadKind } from "@/lib/services/media.service";

const schema = z.object({
  kind: z.enum(Object.keys(uploadPresets) as [UploadKind, ...UploadKind[]]),
  resourceType: z.enum(["image", "video"]),
  bytes: z.number().int().positive(),
});

/** Step 1 of an upload: sign the parameters for a direct browser → Cloudinary upload. */
export const POST = adminRoute(async (request: Request) => {
  const { kind, resourceType, bytes } = await parseBody(request, schema);
  return ok(signUpload(kind, resourceType, bytes));
});
