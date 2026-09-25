"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api-client";
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

async function upload(file: File, kind: UploadKind): Promise<UploadedMedia> {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Upload failed", data.code);
  return data.media;
}

/**
 * File picker that uploads to Cloudinary via the server (which validates type/size/content)
 * and hands back { url, cloudinaryId }. Supports multiple files.
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
        setProgress(list.length > 1 ? `Uploading ${i + 1}/${list.length}…` : "Uploading…");
        await onUploaded(await upload(file, kind));
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
