"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { DUMMY_REELS } from "@/lib/dummy-data";

export default function ShopByReels() {
  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center flex items-center gap-3">
            Shop by Reels
          </h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
          <p className="text-charcoal/60 text-center font-body">Get inspired by our latest looks</p>
        </div>
        
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 gap-4 md:gap-6 hide-scrollbar snap-x">
          {DUMMY_REELS.map((reel) => (
            <div key={reel.id} className="snap-center shrink-0 w-[240px] md:w-auto relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer">
              <Link href={`/product/${reel.productSlug}`}>
                <Image
                  src={reel.image}
                  alt={reel.caption}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
