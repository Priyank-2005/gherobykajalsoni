"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, SearchX } from "lucide-react";
import { ProductCard } from "./product-card";
import { ShopFilters, type FilterValues } from "./shop-filters";
import { SortDropdown } from "./sort-dropdown";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/feedback";
import { SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PRODUCT_SORT_OPTIONS, type ProductListResponse } from "@/types/product";

const FILTER_KEYS = ["category", "sub", "minPrice", "maxPrice", "sizes", "colors", "inStock", "minDiscount"] as const;

/**
 * Product grid + filters + sort + pagination, all driven by the URL query string.
 * Changing a filter updates the URL (router.replace) and the server page re-renders
 * with fresh results, so every view is shareable and back/forward works.
 * `lockedCategory` hides the category filter (category pages); other params (e.g. `sub`, `q`) are preserved.
 */
export function ProductListing({ data, lockedCategory = false }: { data: ProductListResponse; lockedCategory?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const csv = (k: string) => params.get(k)?.split(",").filter(Boolean) ?? [];
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  const values: FilterValues = {
    categories: params.get("category") ?? undefined,
    sub: params.get("sub") ?? undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    sizes: csv("sizes"),
    colors: csv("colors"),
    inStock: params.get("inStock") === "1",
    minDiscount: num("minDiscount"),
  };
  const sort = params.get("sort") ?? "recommended";

  const navigate = (next: URLSearchParams) => {
    next.delete("page"); // any filter/sort change resets to page 1
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const setFilters = (patch: Partial<FilterValues>) => {
    const next = new URLSearchParams(params);
    const merged = { ...values, ...patch };
    const set = (k: string, v: string | undefined) => (v ? next.set(k, v) : next.delete(k));
    if (!lockedCategory) {
      set("category", merged.categories);
      // A subcategory belongs to one category: changing the category clears it.
      set("sub", "categories" in patch ? undefined : merged.sub);
    }
    set("minPrice", merged.minPrice?.toString());
    set("maxPrice", merged.maxPrice?.toString());
    set("sizes", merged.sizes.join(","));
    set("colors", merged.colors.join(","));
    set("inStock", merged.inStock ? "1" : undefined);
    set("minDiscount", merged.minDiscount?.toString());
    navigate(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(params);
    for (const k of FILTER_KEYS) if (!(lockedCategory && (k === "category" || k === "sub"))) next.delete(k);
    navigate(next);
  };

  const setSort = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "recommended") next.delete("sort");
    else next.set("sort", value);
    navigate(next);
  };

  const hrefForPage = (page: number) => {
    const next = new URLSearchParams(params);
    if (page === 1) next.delete("page");
    else next.set("page", String(page));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const activeCount =
    (lockedCategory ? 0 : (values.categories ? 1 : 0) + (values.sub ? 1 : 0)) +
    (values.minPrice !== undefined || values.maxPrice !== undefined ? 1 : 0) +
    values.sizes.length +
    values.colors.length +
    (values.inStock ? 1 : 0) +
    (values.minDiscount ? 1 : 0);

  const filters = (
    <ShopFilters facets={data.facets} values={values} onChange={setFilters} onClear={clearFilters} hideCategory={lockedCategory} />
  );

  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">{filters}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-[85%] max-w-sm bg-baby-pink-light h-full overflow-y-auto p-6 shadow-xl z-10 flex flex-col">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-charcoal" aria-label="Close filters">
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 pt-6">{filters}</div>
            <button onClick={() => setDrawerOpen(false)} className="mt-6 w-full py-3 bg-wine text-white text-sm uppercase tracking-wider">
              Show {data.total} {data.total === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-gold/15">
          <p className="text-sm text-gray-600 w-full sm:w-auto" aria-live="polite">
            {data.total === 0 ? "No products" : `Showing ${from}–${to} of ${data.total} ${data.total === 1 ? "product" : "products"}`}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 bg-white px-4 py-2"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters{activeCount > 0 && ` (${activeCount})`}
            </button>
            <SortDropdown options={[...PRODUCT_SORT_OPTIONS]} value={sort} onChange={setSort} />
          </div>
        </div>

        {isPending ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" aria-busy="true">
            {Array.from({ length: Math.min(data.pageSize, 8) }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data.products.length > 0 ? (
          <>
            <div className={cn("grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6")}>
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefForPage} />
          </>
        ) : (
          <EmptyState
            icon={<SearchX className="w-12 h-12" strokeWidth={1.25} />}
            title="No products found"
            description={activeCount > 0 ? "Try removing a filter or widening the price range." : "New pieces are added regularly. Please check back soon."}
            action={
              activeCount > 0 ? (
                <button onClick={clearFilters} className="px-6 py-3 bg-wine text-white hover:bg-wine/90 transition-colors text-sm">
                  Clear all filters
                </button>
              ) : (
                <Link href="/shop" className="px-6 py-3 bg-wine text-white hover:bg-wine/90 transition-colors text-sm">
                  Browse the collection
                </Link>
              )
            }
          />
        )}
      </div>
    </div>
  );
}
