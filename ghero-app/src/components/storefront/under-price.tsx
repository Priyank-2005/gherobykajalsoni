import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { formatPrice } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

export default function UnderPrice({ maxPrice, products }: { maxPrice: number; products: ProductCardData[] }) {
  if (products.length === 0) return null;
  const label = formatPrice(maxPrice);

  return (
    <section className="py-16 md:py-24 border-t border-baby-pink-deep/50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">Under {label}</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
          <p className="text-charcoal/60 text-center font-body">Beautiful picks that are easy on the pocket</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href={`/shop?maxPrice=${maxPrice}`}
            className="text-gold border-b border-gold pb-1 hover:text-wine hover:border-wine transition-colors"
          >
            View All Under {label}
          </Link>
        </div>
      </div>
    </section>
  );
}
