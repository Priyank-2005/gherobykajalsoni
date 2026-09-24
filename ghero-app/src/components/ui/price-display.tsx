"use client"
import React from 'react';
import { cn, formatPrice, calculateDiscount } from '@/lib/utils';
import { Badge } from './badge';

interface PriceDisplayProps {
  salePrice: number;
  mrp: number;
  className?: string;
}

export function PriceDisplay({ salePrice, mrp, className }: PriceDisplayProps) {
  const discount = calculateDiscount(mrp, salePrice);
  const hasDiscount = discount > 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body", className)}>
      <span className="text-lg font-semibold text-wine">
        {formatPrice(salePrice)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-charcoal/50 line-through">
            {formatPrice(mrp)}
          </span>
          <Badge variant="discount" className="ml-1">
            {discount}% OFF
          </Badge>
        </>
      )}
    </div>
  );
}
