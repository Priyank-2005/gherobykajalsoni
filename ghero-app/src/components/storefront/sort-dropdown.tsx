"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortDropdownProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ options, value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-charcoal bg-white border border-gray-200 px-4 py-2 hover:bg-cream transition-colors"
      >
        <span>Sort by: {selectedOption?.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg z-20">
            <ul className="py-1">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-charcoal hover:bg-cream transition-colors flex items-center justify-between"
                  >
                    {option.label}
                    {value === option.value && <Check className="w-4 h-4 text-wine" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
