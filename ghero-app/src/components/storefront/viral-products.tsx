"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Volume2, VolumeX } from "lucide-react";
import { PriceDisplay } from "@/components/ui/price-display";
import type { ViralProductData } from "@/types/product";
import { announceSound, onOtherSound, videoPoster } from "@/lib/video";

/** One reel: plays muted while on screen, pauses off screen so a long row doesn't play every video at once. */
function ViralCard({ product }: { product: ViralProductData }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const href = `/product/${product.slug}`;

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Another video turned its sound on: this one goes quiet.
  useEffect(() => onOtherSound(product.id, () => setMuted(true)), [product.id]);

  return (
    <div className="snap-start shrink-0 w-[220px] md:w-[260px] flex flex-col">
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-baby-pink group">
        <Link href={href} aria-label={`Shop ${product.name}`} className="absolute inset-0">
          <video
            ref={video}
            src={product.videoUrl}
            poster={videoPoster(product.videoUrl)}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/75 to-transparent">
            <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{product.name}</p>
          </div>
        </Link>
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-wine text-white px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold pointer-events-none">
          <Flame className="w-3 h-3 fill-white" /> Viral
        </span>
        <button
          type="button"
          onClick={() => {
            if (muted) announceSound(product.id);
            setMuted(!muted);
            video.current?.play().catch(() => {});
          }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="pt-3 flex flex-col gap-2 flex-1">
        <PriceDisplay salePrice={product.basePrice} mrp={product.baseMrp} />
        <Link
          href={href}
          className="mt-auto text-center bg-wine text-white text-xs uppercase tracking-wider py-2.5 rounded-md hover:bg-wine/90 transition-colors"
        >
          {product.inStock ? "Shop Now" : "View Product"}
        </Link>
      </div>
    </div>
  );
}

export default function ViralProducts({ products }: { products: ViralProductData[] }) {
  const strip = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  const scroll = (dir: 1 | -1) => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">Viral Products</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
          <p className="text-charcoal/60 text-center font-body">As seen on Instagram — the looks everyone is talking about</p>
        </div>

        <div className="relative">
          <div ref={strip} className="flex overflow-x-auto gap-4 md:gap-6 pb-4 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar snap-x snap-mandatory scroll-px-4 md:scroll-px-0">
            {products.map((product) => (
              <ViralCard key={product.id} product={product} />
            ))}
          </div>
          {products.length > 4 && (
            <>
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label="Scroll left"
                className="hidden md:flex absolute -left-5 top-[40%] -translate-y-1/2 w-10 h-10 bg-white shadow-sm border border-baby-pink-deep rounded-full items-center justify-center text-gold hover:bg-baby-pink transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label="Scroll right"
                className="hidden md:flex absolute -right-5 top-[40%] -translate-y-1/2 w-10 h-10 bg-white shadow-sm border border-baby-pink-deep rounded-full items-center justify-center text-gold hover:bg-baby-pink transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/shop?viral=1" className="text-gold border-b border-gold pb-1 hover:text-wine hover:border-wine transition-colors">
            View All Viral Products
          </Link>
        </div>
      </div>
    </section>
  );
}
