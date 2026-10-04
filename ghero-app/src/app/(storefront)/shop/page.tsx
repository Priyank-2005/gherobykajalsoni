import type { Metadata } from "next";
import Link from "next/link";
import { ProductListing } from "@/components/storefront/product-listing";
import { Breadcrumb } from "@/components/ui/feedback";
import { parseProductQuery } from "@/lib/validations/catalog";
import { listProducts } from "@/lib/services/product.service";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Shop sarees, suits, lehengas, jewellery and bridal wear from Ghero by Kajal Soni.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseProductQuery(await searchParams);
  const data = await listProducts(query);
  // Homepage "View All" links land here (?viral=1, ?maxPrice=…): title the page after that collection.
  const priceOnly = query.maxPrice !== undefined && query.minPrice === undefined;
  const title = query.viral ? "Viral Products" : priceOnly ? `Under ${formatPrice(query.maxPrice!)}` : "Our Collection";
  const intro = query.viral
    ? "The pieces our favourite creators are wearing. Tap any product to shop the look."
    : priceOnly
      ? `Traditional styles priced at ${formatPrice(query.maxPrice!)} or less.`
      : "Discover our curated collection of premium traditional Indian fashion. Each piece is crafted with elegance and sophistication.";

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />

      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-heading text-charcoal mb-4">{title}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto lg:mx-0">{intro}</p>
        {query.viral && (
          <Link href="/shop" className="inline-block mt-3 text-sm text-wine underline underline-offset-4">
            View full collection
          </Link>
        )}
      </div>

      <ProductListing data={data} />
    </div>
  );
}
