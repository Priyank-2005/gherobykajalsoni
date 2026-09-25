import type { UploadApiOptions } from "cloudinary";
import { cloudinary, uploadPresets } from "@/lib/cloudinary";
import { AppError, badRequest } from "@/lib/api";

/**
 * Server-side media uploads to Cloudinary. Files are validated here (MIME + size) before
 * they reach Cloudinary; the browser never gets upload credentials.
 */

export type UploadKind = keyof typeof uploadPresets;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MB = 1024 * 1024;

const RULES: Record<UploadKind, { types: string[]; maxBytes: number }> = {
  productImage: { types: IMAGE_TYPES, maxBytes: 10 * MB },
  categoryImage: { types: IMAGE_TYPES, maxBytes: 10 * MB },
  heroImage: { types: IMAGE_TYPES, maxBytes: 10 * MB },
  heroMobileImage: { types: IMAGE_TYPES, maxBytes: 10 * MB },
  testimonialImage: { types: IMAGE_TYPES, maxBytes: 5 * MB },
  productVideo: { types: VIDEO_TYPES, maxBytes: 100 * MB },
  reelMedia: { types: [...IMAGE_TYPES, ...VIDEO_TYPES], maxBytes: 100 * MB },
};

export function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET && !CLOUDINARY_CLOUD_NAME.startsWith("your-"));
}

/** Check magic bytes so a renamed file can't pass as an image/video. */
function sniffMatches(bytes: Uint8Array, mime: string) {
  const hex = Buffer.from(bytes.slice(0, 12)).toString("hex");
  const ascii = Buffer.from(bytes.slice(0, 12)).toString("latin1");
  switch (mime) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e47");
    case "image/webp":
      return ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
    case "image/avif":
    case "video/mp4":
    case "video/quicktime":
      return ascii.slice(4, 8) === "ftyp";
    case "video/webm":
      return hex.startsWith("1a45dfa3");
    default:
      return false;
  }
}

export async function uploadMedia(file: File, kind: UploadKind) {
  if (!isCloudinaryConfigured()) {
    throw new AppError(503, "Media uploads aren't configured yet (Cloudinary keys missing).", "MEDIA_DISABLED");
  }
  const rule = RULES[kind];
  if (!rule.types.includes(file.type)) {
    throw badRequest(`Unsupported file type ${file.type || "unknown"}. Allowed: ${rule.types.join(", ")}`, "BAD_FILE_TYPE");
  }
  if (file.size > rule.maxBytes) {
    throw badRequest(`File is too large. Maximum is ${rule.maxBytes / MB} MB.`, "FILE_TOO_LARGE");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniffMatches(buffer, file.type)) {
    throw badRequest("File contents don't match its type", "BAD_FILE_CONTENT");
  }

  const options: UploadApiOptions = {
    ...uploadPresets[kind],
    resource_type: file.type.startsWith("video/") ? "video" : "image",
  };
  const result = await new Promise<{ secure_url: string; public_id: string; resource_type: string; width?: number; height?: number }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (error, res) => (error || !res ? reject(error ?? new Error("Upload failed")) : resolve(res)))
        .end(buffer);
    }
  );
  return {
    url: result.secure_url,
    cloudinaryId: result.public_id,
    resourceType: result.resource_type as "image" | "video",
    width: result.width,
    height: result.height,
  };
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
