"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFacets } from "@/types/product";

/** Filter values as they appear in the URL (see validations/catalog.ts). */
export interface FilterValues {
  categories?: string; // single category slug (shop page only)
  sub?: string; // subcategory slug within the selected category
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  minDiscount?: number;
}

interface ShopFiltersProps {
  facets: ProductFacets;
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClear: () => void;
  hideCategory?: boolean;
}

const DISCOUNT_STEPS = [10, 20, 30, 40, 50];

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gold/15 py-4">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between w-full text-left font-medium text-charcoal"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

/**
 * Price inputs apply on blur / Enter so every keystroke doesn't trigger a navigation.
 * Keyed by the applied range, so it resets when the URL changes (e.g. Clear All).
 */
function PriceRange({ min, max, placeholder, onApply }: {
  min?: number;
  max?: number;
  placeholder: { min: number; max: number };
  onApply: (min?: number, max?: number) => void;
}) {
  const [lo, setLo] = useState(min?.toString() ?? "");
  const [hi, setHi] = useState(max?.toString() ?? "");

  const apply = () => onApply(lo ? Number(lo) : undefined, hi ? Number(hi) : undefined);
  const input = "w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-wine";
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <input type="number" min={0} inputMode="numeric" aria-label="Minimum price" placeholder={`₹${placeholder.min}`} value={lo} onChange={(e) => setLo(e.target.value)} onBlur={apply} className={input} />
      <span className="text-gray-400">–</span>
      <input type="number" min={0} inputMode="numeric" aria-label="Maximum price" placeholder={`₹${placeholder.max}`} value={hi} onChange={(e) => setHi(e.target.value)} onBlur={apply} className={input} />
    </form>
  );
}

export function ShopFilters({ facets, values, onChange, onClear, hideCategory = false }: ShopFiltersProps) {
  // Radio groups need names unique per instance: the sidebar, the mobile drawer and pages kept
  // alive for back-navigation can all be mounted at once.
  const uid = useId();
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-heading text-charcoal">Filters</h3>
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-wine underline underline-offset-4">
          Clear All
        </button>
      </div>

      {!hideCategory && facets.categories.length > 0 && (
        <Section title="Category">
          <div className="space-y-2">
            {facets.categories.map((cat) => {
              const selected = values.categories === cat.slug;
              return (
                <div key={cat.slug}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name={`category-${uid}`}
                      checked={selected}
                      onChange={() => onChange({ categories: cat.slug })}
                      className="w-4 h-4 accent-wine"
                    />
                    <span className={cn("text-sm group-hover:text-charcoal transition-colors flex-1", selected ? "text-charcoal font-medium" : "text-gray-600")}>{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.count}</span>
                  </label>
                  {/* Subcategories of the selected category */}
                  {selected && facets.subcategories.length > 0 && (
                    <div className="mt-2 ml-6 pl-3 border-l border-gold/30 space-y-2" role="radiogroup" aria-label={`${cat.name} subcategories`}>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name={`subcategory-${uid}`} checked={!values.sub} onChange={() => onChange({ sub: undefined })} className="w-3.5 h-3.5 accent-wine" />
                        <span className="text-sm text-gray-600 group-hover:text-charcoal flex-1">All {cat.name}</span>
                      </label>
                      {facets.subcategories.map((sub) => (
                        <label key={sub.slug} className={cn("flex items-center gap-2 cursor-pointer group", sub.count === 0 && values.sub !== sub.slug && "opacity-50")}>
                          <input
                            type="radio"
                            name={`subcategory-${uid}`}
                            checked={values.sub === sub.slug}
                            onChange={() => onChange({ sub: sub.slug })}
                            className="w-3.5 h-3.5 accent-wine"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-charcoal transition-colors flex-1">{sub.name}</span>
                          <span className="text-xs text-gray-400">{sub.count}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {values.categories && (
              <button onClick={() => onChange({ categories: undefined })} className="text-xs text-wine underline mt-1">
                All categories
              </button>
            )}
          </div>
        </Section>
      )}

      <Section title="Price Range">
        <PriceRange
          key={`${values.minPrice ?? ""}-${values.maxPrice ?? ""}`}
          min={values.minPrice}
          max={values.maxPrice}
          placeholder={facets.priceRange}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </Section>

      {facets.sizes.length > 0 && (
        <Section title="Size">
          <div className="grid grid-cols-3 gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                onClick={() => onChange({ sizes: toggle(values.sizes, size) })}
                aria-pressed={values.sizes.includes(size)}
                className={cn(
                  "border text-xs py-2 text-center transition-colors",
                  values.sizes.includes(size) ? "border-wine bg-wine text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Color">
          <div className="flex flex-wrap gap-3">
            {facets.colors.map((color) => (
              <button
                key={color.name}
                onClick={() => onChange({ colors: toggle(values.colors, color.name) })}
                title={color.name}
                aria-label={color.name}
                aria-pressed={values.colors.includes(color.name)}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  values.colors.includes(color.name) ? "border-wine ring-2 ring-wine ring-offset-2" : "border-gray-200 hover:scale-110"
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Availability">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input type="checkbox" checked={values.inStock} onChange={(e) => onChange({ inStock: e.target.checked })} className="w-4 h-4 accent-wine" />
          In stock only
        </label>
      </Section>

      <Section title="Discount">
        <div className="space-y-2">
          {DISCOUNT_STEPS.map((d) => (
            <label key={d} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input
                type="radio"
                name={`discount-${uid}`}
                checked={values.minDiscount === d}
                onChange={() => onChange({ minDiscount: d })}
                className="w-4 h-4 accent-wine"
              />
              {d}% off or more
            </label>
          ))}
          {values.minDiscount && (
            <button onClick={() => onChange({ minDiscount: undefined })} className="text-xs text-wine underline">
              Any discount
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}
