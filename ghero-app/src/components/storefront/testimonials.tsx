"use client";

import { Star } from "lucide-react";
import { DUMMY_TESTIMONIALS } from "@/lib/dummy-data";

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">What Our Customers Say</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {DUMMY_TESTIMONIALS.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="bg-white/60 backdrop-blur-sm p-8 rounded-lg border border-baby-pink-deep flex flex-col h-full"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="italic text-charcoal/70 mb-6 flex-grow font-body text-lg">
                "{testimonial.review}"
              </p>
              <div>
                <p className="font-medium text-gold">{testimonial.customerName}</p>
                <p className="text-xs text-charcoal/50 mt-1">Purchased: {testimonial.productName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
