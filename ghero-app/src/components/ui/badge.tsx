import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'discount' | 'new' | 'bestseller';
}

export function Badge({ className, variant = 'new', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-wine focus:ring-offset-2 font-body",
        {
          "bg-wine text-white": variant === 'discount',
          "bg-gold text-white": variant === 'new',
          "bg-rose text-white": variant === 'bestseller',
        },
        className
      )}
      {...props}
    />
  );
}
