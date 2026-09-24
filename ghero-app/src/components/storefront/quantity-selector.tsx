"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
}

export function QuantitySelector({ quantity, onChange, max = 10 }: QuantitySelectorProps) {
  const decrement = () => {
    if (quantity > 1) onChange(quantity - 1);
  };

  const increment = () => {
    if (quantity < max) onChange(quantity + 1);
  };

  return (
    <div className="flex items-center border border-gray-300 bg-white h-12 w-32">
      <button
        onClick={decrement}
        disabled={quantity <= 1}
        className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-charcoal disabled:opacity-50 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center justify-center text-sm font-medium text-charcoal">
        {quantity}
      </div>
      <button
        onClick={increment}
        disabled={quantity >= max}
        className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-charcoal disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
