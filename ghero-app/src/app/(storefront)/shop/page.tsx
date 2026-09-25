import type { Metadata } from "next";
import { ProductListing } from "@/components/storefront/product-listing";
import { Breadcrumb } from "@/components/ui/feedback";
import { parseProductQuery } from "@/lib/validations/catalog";
import { listProducts } from "@/lib/services/product.service";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Shop sarees, suits, lehengas, jewellery and bridal wear from Ghero by Kajal Soni.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseProductQuery(await searchParams);
  const data = await listProducts(query);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />

      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-heading text-charcoal mb-4">Our Collection</h1>
        <p className="text-gray-600 max-w-2xl mx-auto lg:mx-0">
          Discover our curated collection of premium traditional Indian fashion. Each piece is crafted with elegance and sophistication.
        </p>
      </div>

      <ProductListing data={data} />
    </div>
  );
}
