import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { SearchBox } from "@/components/storefront/search-box";
import { ProductListing } from "@/components/storefront/product-listing";
import { EmptyState } from "@/components/ui/feedback";
import { parseProductQuery } from "@/lib/validations/catalog";
import { listProducts } from "@/lib/services/product.service";
import { listCategories } from "@/lib/services/category.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: typeof q === "string" && q.trim() ? `Search: ${q.trim()}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const query = parseProductQuery(raw);
  const term = query.q ?? "";
  const [data, categories] = await Promise.all([term ? listProducts(query) : null, term ? null : listCategories()]);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-heading text-charcoal mb-6">
          {term ? <>Results for “{term}”</> : "Search"}
        </h1>
        <SearchBox key={term} initialQuery={term} />
      </div>

      {data ? (
        data.total === 0 && !raw.sizes && !raw.colors && !raw.minPrice && !raw.maxPrice && !raw.inStock && !raw.minDiscount ? (
          <EmptyState
            icon={<Search className="w-12 h-12" strokeWidth={1.25} />}
            title={`No results for “${term}”`}
            description="Check the spelling, try a more general word like “saree” or “lehenga”, or browse a category below."
            action={
              <Link href="/shop" className="px-6 py-3 bg-wine text-white hover:bg-wine/90 transition-colors text-sm">
                Browse all products
              </Link>
            }
          />
        ) : (
          <ProductListing data={data} />
        )
      ) : (
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">Popular categories</p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories?.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="px-4 py-2 rounded-full border border-gold/30 bg-white/60 text-sm text-charcoal hover:border-wine hover:text-wine">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
