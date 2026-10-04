import { z } from "zod";
import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { uploadPresets } from "@/lib/cloudinary";
import { verifyUpload, type UploadKind } from "@/lib/services/media.service";

const schema = z.object({
  kind: z.enum(Object.keys(uploadPresets) as [UploadKind, ...UploadKind[]]),
  result: z.object({
    public_id: z.string().min(1).max(300),
    version: z.number().int(),
    signature: z.string().min(1).max(100),
    resource_type: z.string().max(20),
  }),
});

/**
 * Step 2 of an upload: verify what the browser uploaded to Cloudinary (signed response,
 * folder, type, size). Returns { url, cloudinaryId, resourceType }, which is then attached
 * to a product / category / CMS item via its own endpoint.
 */
export const POST = adminRoute(async (request: Request) => {
  const { kind, result } = await parseBody(request, schema);
  return ok({ media: await verifyUpload(kind, result) }, { status: 201 });
});
