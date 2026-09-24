"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { DUMMY_PRODUCTS } from "@/lib/dummy-data";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('q', query);
        router.replace(`?${params.toString()}`, { scroll: false });
      } else {
        router.replace(`/search`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchParams, router]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    
    const lowerQuery = debouncedQuery.toLowerCase();
    return DUMMY_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
    );
  }, [debouncedQuery]);

  return (
    <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
      <div className="max-w-2xl mx-auto mb-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-heading text-charcoal mb-8">Search</h1>
        
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, categories..."
            className="w-full pl-12 pr-12 py-4 text-lg border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-wine transition-colors placeholder:text-gray-300"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 p-1 text-gray-400 hover:text-charcoal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div>
        {debouncedQuery.trim() === "" ? (
          <div className="text-center text-gray-500 py-12">
            Enter a search term to find products.
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-center text-gray-600 mb-8">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-heading text-charcoal mb-4">No results found</h3>
            <p className="text-gray-500">We couldn't find anything matching "{debouncedQuery}".</p>
            <p className="text-gray-500 mt-2">Try checking your spelling or use more general terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
