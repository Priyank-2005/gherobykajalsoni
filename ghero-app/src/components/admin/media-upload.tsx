"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ApiError, api, errorMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type UploadKind =
  | "productImage"
  | "productVideo"
  | "categoryImage"
  | "heroImage"
  | "heroMobileImage"
  | "reelMedia"
  | "testimonialImage";

export type UploadedMedia = { url: string; cloudinaryId: string; resourceType: "image" | "video" };

const MB = 1024 * 1024;
// Cloudinary's limit for a single (non-chunked) upload on our plan.
const MAX_VIDEO_BYTES = 100 * MB;

/** Upload to Cloudinary from the browser, reporting progress (0-100). */
function sendToCloudinary(url: string, form: FormData, onProgress: (pct: number) => void) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the generic message
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, (data.error as { message?: string } | undefined)?.message ?? "Upload to Cloudinary failed. Please try again."));
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error while uploading. Please check your connection and try again."));
    xhr.send(form);
  });
}

/**
 * Three steps: our server signs the upload, the browser sends the file straight to
 * Cloudinary (so large videos never hit our server's body-size limits), and our server
 * verifies the result before it can be used.
 */
async function upload(file: File, kind: UploadKind, onProgress: (pct: number) => void): Promise<UploadedMedia> {
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  if (resourceType === "video" && file.size > MAX_VIDEO_BYTES) throw new ApiError(400, `Video is too large (${Math.round(file.size / MB)} MB). Maximum is 100 MB; please compress it first.`);
  const signed = await api<{ uploadUrl: string; fields: Record<string, string | number> }>("/api/admin/media/sign", { body: { kind, resourceType, bytes: file.size } });
  const form = new FormData();
  for (const [k, v] of Object.entries(signed.fields)) form.set(k, String(v));
  form.set("file", file);
  const result = await sendToCloudinary(signed.uploadUrl, form, onProgress);
  const { media } = await api<{ media: UploadedMedia }>("/api/admin/media", { body: { kind, result } });
  return media;
}

/**
 * File picker that uploads to Cloudinary (signed and verified by our server) and hands back
 * { url, cloudinaryId }. Supports multiple files.
 */
export function MediaUpload({
  kind,
  accept = "image/jpeg,image/png,image/webp,image/avif",
  multiple = false,
  label = "Upload",
  onUploaded,
  className,
}: {
  kind: UploadKind;
  accept?: string;
  multiple?: boolean;
  label?: string;
  onUploaded: (media: UploadedMedia) => Promise<void> | void;
  className?: string;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    try {
      for (const [i, file] of list.entries()) {
        const prefix = list.length > 1 ? `Uploading ${i + 1}/${list.length}` : "Uploading";
        setProgress(`${prefix}…`);
        await onUploaded(await upload(file, kind, (pct) => setProgress(`${prefix} ${pct}%`)));
      }
      toast(list.length > 1 ? `${list.length} files uploaded` : "Uploaded");
    } catch (error) {
      toast(error instanceof ApiError && error.code === "MEDIA_DISABLED" ? "Uploads need Cloudinary keys in .env (CLOUDINARY_*)." : errorMessage(error), "error");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      <button
        type="button"
        disabled={Boolean(progress)}
        onClick={() => input.current?.click()}
        className={cn(
          "inline-flex items-center gap-2 border border-dashed border-gray-400 rounded-md px-4 py-2 text-sm text-gray-600 hover:border-wine hover:text-wine disabled:opacity-60",
          className
        )}
      >
        <Upload className="w-4 h-4" /> {progress ?? label}
      </button>
    </>
  );
}
