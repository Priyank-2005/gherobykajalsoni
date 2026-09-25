"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { HomepageData } from "@/lib/services/homepage.service";

type Slide = HomepageData["hero"][number];

/** Slides with ctaText show the headline + buttons; others are image-only links to ctaUrl. */
export default function HeroSection({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  const count = slides.length;
  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, count]);

  if (count === 0) return null;
  const slide = slides[Math.min(current, count - 1)];
  const hasText = Boolean(slide.ctaText);

  return (
    <section className="relative h-[85vh] md:h-screen w-full overflow-hidden">
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.imageUrl}
            alt={slide.heading}
            fill
            className="object-cover object-center"
            priority={current === 0}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* First slide — text overlay */}
      <AnimatePresence>
        {hasText && (
          <div className="absolute inset-0 flex items-end md:items-center justify-center pb-28 md:pb-0 z-10">
            <div className="container mx-auto px-4 flex flex-col items-center text-center">
              <motion.h1
                key={`heading-${current}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-heading text-4xl md:text-6xl lg:text-7xl text-white mb-4 max-w-4xl drop-shadow-lg"
              >
                {slide.heading}
              </motion.h1>

              <motion.p
                key={`sub-${current}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                className="font-body text-lg md:text-xl text-gold-light mb-8 max-w-2xl font-light drop-shadow-md"
              >
                {slide.subheading}
              </motion.p>

              <motion.div
                key={`cta-${current}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <Link
                  href={slide.ctaUrl || "/shop"}
                  className="inline-flex items-center justify-center px-8 py-3 bg-gold hover:bg-gold-dark text-white font-medium transition-colors min-w-[200px] tracking-wide"
                >
                  {slide.ctaText}
                </Link>
                {slide.secondaryCtaText && (
                  <Link
                    href={slide.secondaryCtaUrl || "/shop"}
                    className="inline-flex items-center justify-center px-8 py-3 bg-transparent border border-white text-white hover:bg-white/10 transition-colors min-w-[200px] tracking-wide"
                  >
                    {slide.secondaryCtaText}
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Product-only slides — just images as requested */}
      <AnimatePresence>
        {!hasText && (
          <motion.div
            key={`label-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <Link href={slide.ctaUrl || "/shop"} className="absolute inset-0 z-20">
              <span className="sr-only">Shop {slide.heading}</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {count > 1 && (
      <>
      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 md:bottom-8 left-0 right-0 z-20 flex justify-center gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-gold"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
      </>
      )}
    </section>
  );
}
