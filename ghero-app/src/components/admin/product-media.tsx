"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";
import { MediaUpload } from "./media-upload";

type Img = { id: string; url: string; alt: string | null };
type Vid = { id: string; url: string; thumbnail: string | null };

/** Product images (first = cover, reorderable) and videos. Uploads go through /api/admin/media. */
export function ProductMedia({ productId, productName, images, videos }: { productId: string; productName: string; images: Img[]; videos: Vid[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (msg) toast(msg);
      router.refresh();
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, delta: number) => {
    const ids = images.map((i) => i.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    act(() => api(`/api/admin/products/${productId}/media`, { method: "PUT", body: { imageIds: ids } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-medium">Images <span className="text-gray-400 font-normal">(first image is the cover)</span></h3>
          <MediaUpload
            kind="productImage"
            multiple
            label="Upload images"
            onUploaded={(m) => api(`/api/admin/products/${productId}/media`, { body: { kind: "image", url: m.url, cloudinaryId: m.cloudinaryId, alt: productName } }).then(() => router.refresh())}
          />
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-gray-500">No images yet. JPG, PNG, WebP or AVIF up to 10 MB.</p>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((img, i) => (
              <li key={img.id} className="relative group">
                <div className="relative aspect-[3/4] bg-gray-100 rounded overflow-hidden border border-gray-200">
                  <Image src={img.url} alt={img.alt ?? ""} fill sizes="160px" className="object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-wine text-white text-[10px] px-1.5 py-0.5 rounded">Cover</span>}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex">
                    <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move left" className="p-1 text-gray-500 hover:text-charcoal disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" disabled={busy || i === images.length - 1} onClick={() => move(i, 1)} aria-label="Move right" className="p-1 text-gray-500 hover:text-charcoal disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label="Delete image"
                    onClick={() => confirm("Delete this image?") && act(() => api(`/api/admin/products/${productId}/media/${img.id}?kind=image`, { method: "DELETE" }), "Image deleted")}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-medium">Videos</h3>
          <MediaUpload
            kind="productVideo"
            accept="video/mp4,video/webm,video/quicktime"
            label="Upload video"
            onUploaded={(m) => api(`/api/admin/products/${productId}/media`, { body: { kind: "video", url: m.url, cloudinaryId: m.cloudinaryId } }).then(() => router.refresh())}
          />
        </div>
        {videos.length === 0 ? (
          <p className="text-sm text-gray-500">Optional. MP4, WebM or MOV up to 100 MB.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {videos.map((v) => (
              <li key={v.id}>
                <video src={v.url} poster={v.thumbnail ?? undefined} controls className="w-full aspect-[3/4] object-cover bg-black rounded" />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => confirm("Delete this video?") && act(() => api(`/api/admin/products/${productId}/media/${v.id}?kind=video`, { method: "DELETE" }), "Video deleted")}
                  className="mt-1 text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
