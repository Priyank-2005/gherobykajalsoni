import React from 'react';
import { cn } from '@/lib/utils';

export function SkeletonBox({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-charcoal/10", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-charcoal/10 h-4 w-full", className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      <SkeletonBox className="aspect-[3/4] w-full rounded-lg" />
      <div className="space-y-2 p-2">
        <SkeletonText className="w-1/3 h-3" />
        <SkeletonText className="w-3/4 h-5" />
        <SkeletonText className="w-1/2 h-5 mt-2" />
      </div>
    </div>
  );
}
