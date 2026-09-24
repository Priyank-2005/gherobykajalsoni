"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { DUMMY_CATEGORIES } from "@/lib/dummy-data";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function ShopByCategory() {
  const categories = DUMMY_CATEGORIES.slice(0, 6);

  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">Shop by Category</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={item}>
              <Link href={`/category/${category.slug}`} className="group block relative aspect-[3/4] overflow-hidden rounded-md bg-baby-pink">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex flex-col items-center">
                  <h3 className="text-white font-heading text-xl md:text-2xl mb-1">{category.name}</h3>
                  <span className="text-white/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 inline-block">
                    Shop Now
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
