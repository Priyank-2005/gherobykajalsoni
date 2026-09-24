"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { ShopFilters } from "@/components/storefront/shop-filters";
import { SortDropdown } from "@/components/storefront/sort-dropdown";
import {
  DUMMY_PRODUCTS,
  DUMMY_CATEGORIES,
  SIZES,
  COLORS,
  SORT_OPTIONS,
} from "@/lib/dummy-data";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShopPage() {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    sizes: [] as string[],
    colors: [] as string[],
    priceRange: [0, 100000] as [number, number],
  });

  const filteredProducts = useMemo(() => {
    let result = DUMMY_PRODUCTS;

    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category.slug));
    }
    if (filters.sizes.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => filters.sizes.includes(v.size)));
    }
    if (filters.colors.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => filters.colors.includes(v.color)));
    }
    result = result.filter(
      (p) => p.basePrice >= filters.priceRange[0] && p.basePrice <= filters.priceRange[1]
    );

    // Sorting
    switch (sortValue) {
      case "price-asc":
        result = [...result].sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "newest":
        // Assuming higher ID is newer for dummy data, or we could just use a date if available
        result = [...result].reverse();
        break;
      case "featured":
      default:
        // Keep original order
        break;
    }

    return result;
  }, [filters, sortValue]);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-wine">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-charcoal font-medium">Shop</span>
      </nav>

      {/* Page Header */}
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-heading text-charcoal mb-4">Our Collection</h1>
        <p className="text-gray-600 max-w-2xl">
          Discover our curated collection of premium traditional Indian fashion. Each piece is crafted with elegance and sophistication.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-1/4 shrink-0">
          <ShopFilters
            categories={DUMMY_CATEGORIES}
            sizes={SIZES}
            colors={COLORS}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileFiltersOpen(false)} />
            <div className="relative w-4/5 max-w-sm bg-white h-full overflow-y-auto p-6 shadow-xl z-10 animate-in slide-in-from-left">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-charcoal"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-heading mb-6">Filters</h2>
              <ShopFilters
                categories={DUMMY_CATEGORIES}
                sizes={SIZES}
                colors={COLORS}
                filters={filters}
                setFilters={setFilters}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>

            <div className="flex items-center gap-4">
              <button
                className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2"
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <div className="hidden sm:block">
                <SortDropdown options={SORT_OPTIONS} value={sortValue} onChange={setSortValue} />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-heading text-charcoal mb-4">No products found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your filters to find what you're looking for.</p>
              <button
                onClick={() =>
                  setFilters({ categories: [], sizes: [], colors: [], priceRange: [0, 100000] })
                }
                className="inline-flex items-center justify-center px-6 py-3 bg-wine text-white hover:bg-wine/90 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
