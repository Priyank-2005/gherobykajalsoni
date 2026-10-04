import { cloudinary, uploadPresets } from "@/lib/cloudinary";
import { AppError, badRequest } from "@/lib/api";

/**
 * Media uploads go straight from the browser to Cloudinary (big videos never pass through our
 * server, whose request bodies are capped: 10 MB in the proxy, 4.5 MB on Vercel):
 * 1. signUpload: the server signs the upload parameters (folder, allowed formats, resize), so
 *    only signed uploads into our folders are possible and the API secret never leaves the server.
 * 2. The browser uploads the file to Cloudinary with that signature.
 * 3. verifyUpload: the server checks Cloudinary's signed response and the size/type rules
 *    (deleting the file if they fail) before the URL is used anywhere.
 */

export type UploadKind = keyof typeof uploadPresets;

const IMAGE_FORMATS = ["jpg", "png", "webp", "avif"];
const VIDEO_FORMATS = ["mp4", "webm", "mov"];
const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<UploadKind, { image: boolean; video: boolean; maxImageBytes: number; maxVideoBytes: number }> = {
  productImage: { image: true, video: false, maxImageBytes: 10 * MB, maxVideoBytes: 0 },
  categoryImage: { image: true, video: false, maxImageBytes: 10 * MB, maxVideoBytes: 0 },
  heroImage: { image: true, video: false, maxImageBytes: 10 * MB, maxVideoBytes: 0 },
  heroMobileImage: { image: true, video: false, maxImageBytes: 10 * MB, maxVideoBytes: 0 },
  testimonialImage: { image: true, video: false, maxImageBytes: 5 * MB, maxVideoBytes: 0 },
  productVideo: { image: false, video: true, maxImageBytes: 0, maxVideoBytes: 100 * MB },
  reelMedia: { image: true, video: true, maxImageBytes: 10 * MB, maxVideoBytes: 100 * MB },
};

// Cloudinary "incoming" transformations: images are resized on upload, as before.
const IMAGE_TRANSFORMATION: Partial<Record<UploadKind, string>> = {
  productImage: "c_limit,h_1600,q_auto:good,w_1200",
  categoryImage: "c_fill,h_800,q_auto:good,w_800",
  heroImage: "c_limit,h_1080,q_auto:good,w_1920",
  heroMobileImage: "c_limit,h_1024,q_auto:good,w_768",
  testimonialImage: "c_fill,h_200,q_auto:good,w_200",
};

export function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET && !CLOUDINARY_CLOUD_NAME.startsWith("your-"));
}

function requireCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new AppError(503, "Media uploads aren't configured yet (Cloudinary keys missing).", "MEDIA_DISABLED");
  }
  return { cloudName: process.env.CLOUDINARY_CLOUD_NAME!, apiKey: process.env.CLOUDINARY_API_KEY!, apiSecret: process.env.CLOUDINARY_API_SECRET! };
}

/** Signed parameters for one direct browser → Cloudinary upload. */
export function signUpload(kind: UploadKind, resourceType: "image" | "video", bytes: number) {
  const { cloudName, apiKey, apiSecret } = requireCloudinary();
  const rule = UPLOAD_RULES[kind];
  if (resourceType === "image" ? !rule.image : !rule.video) throw badRequest(`${resourceType === "image" ? "Images" : "Videos"} can't be uploaded here`, "BAD_FILE_TYPE");
  const max = resourceType === "image" ? rule.maxImageBytes : rule.maxVideoBytes;
  if (bytes > max) throw badRequest(`File is too large. Maximum is ${max / MB} MB.`, "FILE_TOO_LARGE");

  const params: Record<string, string | number> = {
    timestamp: Math.round(Date.now() / 1000),
    folder: uploadPresets[kind].folder,
    allowed_formats: (resourceType === "image" ? IMAGE_FORMATS : VIDEO_FORMATS).join(","),
  };
  const transformation = resourceType === "image" ? IMAGE_TRANSFORMATION[kind] : undefined;
  if (transformation) params.transformation = transformation;
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    fields: { ...params, api_key: apiKey, signature: cloudinary.utils.api_sign_request(params, apiSecret) },
  };
}

export type CloudinaryUploadResult = {
  public_id: string;
  version: number;
  signature: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
};

/**
 * Check a finished direct upload. Cloudinary's response signature proves the public id and
 * version are real; size, type and URL are then read from Cloudinary itself (not trusted from
 * the browser). Anything outside our folder or the size/type rules is deleted and refused.
 */
export async function verifyUpload(kind: UploadKind, r: Pick<CloudinaryUploadResult, "public_id" | "version" | "signature" | "resource_type">) {
  const { apiSecret } = requireCloudinary();
  const expected = cloudinary.utils.api_sign_request({ public_id: r.public_id, version: r.version }, apiSecret);
  if (expected !== r.signature) throw badRequest("Upload couldn't be verified. Please try again.", "BAD_UPLOAD");

  const resourceType = r.resource_type === "video" ? "video" : "image";
  const info = (await cloudinary.api.resource(r.public_id, { resource_type: resourceType })) as { secure_url: string; format: string; bytes: number };
  const rule = UPLOAD_RULES[kind];
  const isVideo = resourceType === "video";
  const okType = isVideo ? rule.video && VIDEO_FORMATS.includes(info.format) : rule.image && IMAGE_FORMATS.includes(info.format);
  const max = isVideo ? rule.maxVideoBytes : rule.maxImageBytes;
  const okFolder = r.public_id.startsWith(`${uploadPresets[kind].folder}/`);
  if (!okType || !okFolder || info.bytes > max) {
    await cloudinary.uploader.destroy(r.public_id, { resource_type: resourceType }).catch(() => undefined);
    throw badRequest(!okType ? "That file type isn't allowed here" : info.bytes > max ? `File is too large. Maximum is ${max / MB} MB.` : "Upload went to the wrong place", "BAD_FILE");
  }
  return { url: info.secure_url, cloudinaryId: r.public_id, resourceType: resourceType as "image" | "video" };
}

/**
 * Best-effort delete of Cloudinary assets after their DB rows are removed.
 * Seeded local placeholders (cloudinaryId "local") are skipped.
 */
export async function deleteMedia(cloudinaryIds: (string | null | undefined)[]) {
  if (!isCloudinaryConfigured()) return;
  const ids = cloudinaryIds.filter((id): id is string => Boolean(id) && id !== "local");
  await Promise.allSettled(
    ids.flatMap((id) => [
      cloudinary.uploader.destroy(id, { resource_type: "image" }),
      cloudinary.uploader.destroy(id, { resource_type: "video" }),
    ])
  );
}
