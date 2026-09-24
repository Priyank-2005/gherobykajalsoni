"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { DUMMY_TESTIMONIALS } from "@/lib/dummy-data";
import { motion, AnimatePresence } from "framer-motion";

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % DUMMY_TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + DUMMY_TESTIMONIALS.length) % DUMMY_TESTIMONIALS.length);
  }, []);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const testimonial = DUMMY_TESTIMONIALS[current];

  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50 overflow-hidden relative">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">What Our Customers Say</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
        </div>
        
        <div className="relative min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full"
            >
              <div className="bg-white/60 backdrop-blur-sm p-8 md:p-12 rounded-lg border border-baby-pink-deep flex flex-col items-center text-center shadow-sm relative">
                <Quote className="absolute top-6 left-6 w-10 h-10 text-gold/20" />
                <Quote className="absolute bottom-6 right-6 w-10 h-10 text-gold/20 rotate-180" />
                
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                </div>
                
                <p className="italic text-charcoal/80 mb-8 font-heading text-xl md:text-2xl leading-relaxed max-w-2xl">
                  "{testimonial.review}"
                </p>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-baby-pink-deep rounded-full flex items-center justify-center text-gold font-heading text-xl mb-3">
                    {testimonial.customerName.charAt(0)}
                  </div>
                  <p className="font-medium text-gold text-lg">{testimonial.customerName}</p>
                  <p className="text-sm text-charcoal/50 mt-1">Purchased: {testimonial.productName}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <button
            onClick={prev}
            className="absolute -left-2 md:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-sm border border-baby-pink-deep rounded-full flex items-center justify-center text-gold hover:bg-baby-pink transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={next}
            className="absolute -right-2 md:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-sm border border-baby-pink-deep rounded-full flex items-center justify-center text-gold hover:bg-baby-pink transition-colors z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {DUMMY_TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-gold"
                  : "w-2 bg-gold/30 hover:bg-gold/60"
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
