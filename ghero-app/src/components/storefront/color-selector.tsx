"use client";

import { cn } from "@/lib/utils";

interface ColorOption {
  name: string;
  hex: string;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorSelector({ colors, selectedColor, onSelect }: ColorSelectorProps) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {colors.map((color) => (
        <button
          key={color.name}
          onClick={() => onSelect(color.name)}
          title={color.name}
          className={cn(
            "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center focus:outline-none",
            selectedColor === color.name
              ? "border-wine ring-2 ring-wine ring-offset-2"
              : "border-gray-200 hover:scale-110"
          )}
          style={{ backgroundColor: color.hex }}
        >
          <span className="sr-only">{color.name}</span>
        </button>
      ))}
    </div>
  );
}
