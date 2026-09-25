"use client";

import { cn } from "@/lib/utils";

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
  /** Sizes shown but not selectable (out of stock for the chosen colour). */
  unavailable?: string[];
}

export function SizeSelector({ sizes, selectedSize, onSelect, unavailable = [] }: SizeSelectorProps) {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Size">
      {sizes.map((size) => {
        const disabled = unavailable.includes(size);
        return (
        <button
          key={size}
          type="button"
          role="radio"
          aria-checked={selectedSize === size}
          disabled={disabled}
          title={disabled ? `${size}: out of stock` : size}
          onClick={() => onSelect(size)}
          className={cn(
            "h-12 min-w-[3rem] px-4 border flex items-center justify-center text-sm font-medium transition-colors",
            selectedSize === size
              ? "border-wine bg-wine text-white"
              : "border-gray-300 text-charcoal hover:border-gray-400 bg-white",
            disabled && "opacity-40 line-through cursor-not-allowed hover:border-gray-300"
          )}
        >
          {size}
        </button>
        );
      })}
    </div>
  );
}
