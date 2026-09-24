import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'discount' | 'new' | 'bestseller';
}

export function Badge({ className, variant = 'new', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-1.5 md:px-2.5 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wider font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 font-body whitespace-nowrap",
        {
          "bg-wine text-white": variant === 'discount',
          "bg-gold text-white": variant === 'new',
          "bg-gold-dark text-white": variant === 'bestseller',
        },
        className
      )}
      {...props}
    />
  );
}
