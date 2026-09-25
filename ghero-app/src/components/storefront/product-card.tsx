"use client"
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/ui/price-display';

import type { ProductCardData } from '@/types/product';

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <motion.div 
        className={cn("flex flex-col h-full bg-white/80 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg border border-baby-pink-deep/30 hover:border-gold/30", className)}
        whileHover={{ y: -4 }}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-baby-pink">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.isNewArrival && <Badge variant="new">New Arrival</Badge>}
            {product.isBestseller && <Badge variant="bestseller">Bestseller</Badge>}
          </div>
          {!product.inStock && (
            <div className="absolute inset-x-0 bottom-0 bg-charcoal/70 text-white text-xs uppercase tracking-widest text-center py-2 z-10">
              Sold out
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 gap-1.5">
          <p className="text-xs text-gold/80 uppercase tracking-wider font-body">
            {product.subcategory?.name ?? product.category.name}
          </p>
          <h3 className="font-heading text-lg text-charcoal line-clamp-2 leading-tight group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          <div className="mt-auto pt-2">
            <PriceDisplay salePrice={product.basePrice} mrp={product.baseMrp} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
