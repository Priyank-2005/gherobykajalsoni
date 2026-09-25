"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageInfo, ProductVideoInfo } from "@/types/product";

type Media = { kind: "image"; id: string; url: string; alt: string } | { kind: "video"; id: string; url: string; thumbnail: string | null };

/**
 * Product media viewer.
 * Desktop: Thumbnails on the left, main image on the right. Hover to zoom.
 * Mobile: Swipe for main image, thumbnail strip below.
 */
export function ProductGallery({ name, images, videos }: { name: string; images: ProductImageInfo[]; videos: ProductVideoInfo[] }) {
  const media: Media[] = [
    ...images.map((i) => ({ kind: "image" as const, id: i.id, url: i.url, alt: i.alt || name })),
    ...videos.map((v) => ({ kind: "video" as const, id: v.id, url: v.url, thumbnail: v.thumbnail })),
  ];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const current = media[index];

  if (!current) {
    return <div className="aspect-[3/4] w-full max-w-md mx-auto bg-baby-pink rounded-sm flex items-center justify-center text-charcoal/40">No image</div>;
  }

  const go = (i: number) => {
    const next = (i + media.length) % media.length;
    setIndex(next);
    // Keep the mobile swipe strip in sync when a thumbnail/arrow is used.
    strip.current?.scrollTo({ left: next * strip.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 lg:sticky lg:top-28">
      
      {/* Thumbnails (Left side on desktop, bottom on mobile) */}
      {media.length > 1 && (
        <div 
          role="tablist" 
          aria-label="Product images and videos" 
          className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-140px)] hide-scrollbar justify-start pb-2 md:pb-0 md:pr-2 order-2 md:order-1"
        >
          {media.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === index}
              aria-label={m.kind === "video" ? `Video ${i + 1}` : `Image ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "relative w-[4.5rem] h-24 md:w-20 md:h-[6.5rem] shrink-0 overflow-hidden bg-baby-pink border-2 rounded-sm transition-colors",
                i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100 hover:border-gold/40"
              )}
            >
              {m.kind === "image" ? (
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <>
                  {m.thumbnail && <Image src={m.thumbnail} alt="" fill sizes="80px" className="object-cover" />}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Image Container */}
      <div className="flex-1 order-1 md:order-2">
        {/* Desktop main view */}
        <div
          className="hidden md:block relative aspect-[3/4] mx-auto w-full max-w-[600px] bg-baby-pink rounded-sm overflow-hidden cursor-zoom-in group"
          onMouseMove={(e) => {
            if (current.kind !== "image") return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {current.kind === "image" ? (
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt}
              fill
              priority
              sizes="(max-width: 1024px) 60vw, 40vw"
              className="object-cover transition-transform duration-200 ease-out"
              style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          ) : (
            <video key={current.id} src={current.url} poster={current.thumbnail ?? undefined} controls autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover cursor-auto" />
          )}
          {media.length > 1 && (
            <>
              <button onClick={() => go(index - 1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-charcoal flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => go(index + 1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-charcoal flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile swipe strip */}
        <div
          ref={strip}
          className="md:hidden flex overflow-x-auto snap-x snap-mandatory -mx-4 hide-scrollbar"
          onScroll={(e) => {
            const i = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
            if (i !== index) setIndex(i);
          }}
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
      </div>

    </div>
  );
}
