"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FilterState {
  categories: string[];
  sizes: string[];
  colors: string[];
  priceRange: [number, number];
}

interface ShopFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  hideCategory?: boolean;
}

export function ShopFilters({
  categories,
  sizes,
  colors,
  filters,
  setFilters,
  hideCategory = false,
}: ShopFiltersProps) {
  const [openSections, setOpenSections] = useState({
    category: !hideCategory,
    price: true,
    size: true,
    color: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryChange = (slug: string) => {
    setFilters((prev) => {
      const newCategories = prev.categories.includes(slug)
        ? prev.categories.filter((c) => c !== slug)
        : [...prev.categories, slug];
      return { ...prev, categories: newCategories };
    });
  };

  const handleSizeChange = (size: string) => {
    setFilters((prev) => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: newSizes };
    });
  };

  const handleColorChange = (colorName: string) => {
    setFilters((prev) => {
      const newColors = prev.colors.includes(colorName)
        ? prev.colors.filter((c) => c !== colorName)
        : [...prev.colors, colorName];
      return { ...prev, colors: newColors };
    });
  };

  const handlePriceChange = (index: 0 | 1, value: string) => {
    const numValue = value === "" ? (index === 0 ? 0 : 100000) : parseInt(value, 10);
    setFilters((prev) => {
      const newRange = [...prev.priceRange] as [number, number];
      newRange[index] = numValue;
      return { ...prev, priceRange: newRange };
    });
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      sizes: [],
      colors: [],
      priceRange: [0, 100000],
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading text-charcoal">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-wine underline underline-offset-4"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      {!hideCategory && (
        <div className="border-b border-gray-200 py-4">
          <button
            onClick={() => toggleSection("category")}
            className="flex items-center justify-between w-full text-left font-medium text-charcoal"
          >
            <span>Category</span>
            {openSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {openSections.category && (
            <div className="mt-4 space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat.slug)}
                    onChange={() => handleCategoryChange(cat.slug)}
                    className="w-4 h-4 rounded border-gray-300 text-wine focus:ring-wine"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-charcoal transition-colors">
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Filter */}
      <div className="border-b border-gray-200 py-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-left font-medium text-charcoal"
        >
          <span>Price Range</span>
          {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.price && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0] === 0 ? "" : filters.priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-wine"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1] === 100000 ? "" : filters.priceRange[1]}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-wine"
            />
          </div>
        )}
      </div>

      {/* Size Filter */}
      <div className="border-b border-gray-200 py-4">
        <button
          onClick={() => toggleSection("size")}
          className="flex items-center justify-between w-full text-left font-medium text-charcoal"
        >
          <span>Size</span>
          {openSections.size ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.size && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={cn(
                  "border text-xs py-2 text-center transition-colors",
                  filters.sizes.includes(size)
                    ? "border-wine bg-wine text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="border-b border-gray-200 py-4">
        <button
          onClick={() => toggleSection("color")}
          className="flex items-center justify-between w-full text-left font-medium text-charcoal"
        >
          <span>Color</span>
          {openSections.color ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.color && (
          <div className="mt-4 flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorChange(color.name)}
                title={color.name}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  filters.colors.includes(color.name)
                    ? "border-wine ring-2 ring-wine ring-offset-2"
                    : "border-gray-200 hover:scale-110"
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
