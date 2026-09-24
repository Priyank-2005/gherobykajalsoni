import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { DUMMY_PRODUCTS } from "@/lib/dummy-data";

export default function NewArrivals() {
  const newArrivals = DUMMY_PRODUCTS.filter(p => p.isNewArrival).slice(0, 4);

  return (
    <section className="py-16 md:py-24 bg-baby-pink-light">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2 text-center">New Arrivals</h2>
          <div className="w-16 h-0.5 bg-gold mb-4"></div>
          <p className="text-charcoal/60 text-center font-body">The latest additions to our collection</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link 
            href="/collections/new-arrivals" 
            className="text-gold border-b border-gold pb-1 hover:text-wine hover:border-wine transition-colors"
          >
            View All New Arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
