"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Volume2, VolumeX } from "lucide-react";
import type { HomepageData } from "@/lib/services/homepage.service";
import { announceSound, onOtherSound, videoPoster } from "@/lib/video";

type Reel = HomepageData["reels"][number];

/**
 * A video reel: plays (muted) while on screen and pauses off screen. A sound button turns the
 * audio on; only one reel plays with sound at a time. The play button appears only when the
 * video is actually paused (e.g. the phone blocked autoplay in low-power mode).
 */
function VideoReel({ reel, soundOn, onSound }: { reel: Reel; soundOn: boolean; onSound: (on: boolean) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (!reduceMotion) el.play().catch(() => {});
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Another reel took the sound: this one goes quiet (but keeps playing).
  useEffect(() => {
    if (video.current) video.current.muted = !soundOn;
  }, [soundOn]);

  const play = () => video.current?.play().catch(() => {});

  return (
    <>
      <video
        ref={video}
        src={reel.mediaUrl}
        poster={reel.thumbnail ?? videoPoster(reel.mediaUrl)}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!playing && (
        <button
          type="button"
          onClick={play}
          aria-label="Play reel"
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
        >
          <Play className="w-6 h-6 fill-white ml-0.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          onSound(!soundOn);
          play();
        }}
        aria-label={soundOn ? "Mute reel" : "Unmute reel"}
        aria-pressed={soundOn}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
      >
        {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </>
  );
}

function ReelCard({ reel, soundOn, onSound }: { reel: Reel; soundOn: boolean; onSound: (on: boolean) => void }) {
  const href = reel.link ?? "/shop";
  const isVideo = reel.mediaType === "video";
  return (
    <div className="snap-center shrink-0 w-[240px] md:w-auto relative aspect-[9/16] rounded-xl overflow-hidden bg-baby-pink group">
      {/* Media first, then the full-card link, then the controls on top of the link. */}
      {isVideo ? (
        <VideoReel reel={reel} soundOn={soundOn} onSound={onSound} />
      ) : (
        <Image
          src={reel.mediaUrl}
          alt={reel.caption ?? "Ghero reel"}
          fill
          sizes="(max-width: 768px) 240px, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <Link href={href} aria-label={reel.caption ? `Shop: ${reel.caption}` : "Shop this look"} className="absolute inset-0 z-0">
        <span className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/75 via-black/30 to-transparent">
          {reel.caption && <span className="block text-white text-sm leading-snug line-clamp-2 mb-2">{reel.caption}</span>}
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-gold-light group-hover:text-white transition-colors">
            Shop the look <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </span>
      </Link>
    </div>
  );
}

export default function ShopByReels({ reels }: { reels: HomepageData["reels"] }) {
  // Only one reel (and only one video on the page) plays with sound at a time.
  const [soundId, setSoundId] = useState<string | null>(null);
  useEffect(() => onOtherSound("shop-by-reels", () => setSoundId(null)), []);
  if (reels.length === 0) return null;
  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">Shop by Reels</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
          <p className="text-charcoal/60 text-center font-body">Get inspired by our latest looks</p>
        </div>

        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 gap-4 md:gap-6 hide-scrollbar snap-x">
          {reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              soundOn={soundId === reel.id}
              onSound={(on) => {
                setSoundId(on ? reel.id : null);
                if (on) announceSound("shop-by-reels");
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
