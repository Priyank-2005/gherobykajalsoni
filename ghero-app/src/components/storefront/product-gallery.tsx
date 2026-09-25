"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageInfo, ProductVideoInfo } from "@/types/product";

type Media = { kind: "image"; id: string; url: string; alt: string } | { kind: "video"; id: string; url: string; thumbnail: string | null };

/**
 * Image/video gallery. Desktop: hover to zoom (2x, follows the cursor). Thumbnails switch media.
 * Mobile: swipeable strip with snap points.
 */
export function ProductGallery({ name, images, videos }: { name: string; images: ProductImageInfo[]; videos: ProductVideoInfo[] }) {
  const media: Media[] = [
    ...images.map((i) => ({ kind: "image" as const, id: i.id, url: i.url, alt: i.alt || name })),
    ...videos.map((v) => ({ kind: "video" as const, id: v.id, url: v.url, thumbnail: v.thumbnail })),
  ];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = media[index];

  if (!current) {
    return <div className="aspect-[3/4] w-full bg-baby-pink rounded-sm flex items-center justify-center text-charcoal/40">No image</div>;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {media.length > 1 && (
        <div className="hidden md:flex md:flex-col gap-3 md:w-20 shrink-0" role="tablist" aria-label="Product media">
          {media.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === index}
              aria-label={m.kind === "video" ? `Video ${i + 1}` : `Image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn("relative aspect-[3/4] w-full overflow-hidden bg-baby-pink border-2 transition-colors", i === index ? "border-wine" : "border-transparent hover:border-gold/40")}
            >
              {m.kind === "image" ? (
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <>
                  {m.thumbnail && <Image src={m.thumbnail} alt="" fill sizes="80px" className="object-cover" />}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Desktop main view */}
      <div
        className="hidden md:block relative aspect-[3/4] w-full bg-baby-pink rounded-sm overflow-hidden cursor-zoom-in"
        onMouseMove={(e) => {
          if (current.kind !== "image") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {current.kind === "image" ? (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-200 ease-out"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        ) : (
          <video src={current.url} poster={current.thumbnail ?? undefined} controls playsInline className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      {/* Mobile swipe strip */}
      <div className="md:hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory -mx-4 hide-scrollbar"
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {media.map((m, i) => (
            <div key={m.id} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-baby-pink">
              {m.kind === "image" ? (
                <Image src={m.url} alt={m.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
              ) : (
                <video src={m.url} poster={m.thumbnail ?? undefined} controls playsInline className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
        {media.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3" aria-hidden>
            {media.map((m, i) => (
              <span key={m.id} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-wine" : "w-1.5 bg-gold/40")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
