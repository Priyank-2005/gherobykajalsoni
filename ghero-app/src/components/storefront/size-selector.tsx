"use client";

import { cn } from "@/lib/utils";

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
}

export function SizeSelector({ sizes, selectedSize, onSelect }: SizeSelectorProps) {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={cn(
            "h-12 min-w-[3rem] px-4 border flex items-center justify-center text-sm font-medium transition-colors",
            selectedSize === size
              ? "border-wine bg-wine text-white"
              : "border-gray-300 text-charcoal hover:border-gray-400 bg-white"
          )}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
