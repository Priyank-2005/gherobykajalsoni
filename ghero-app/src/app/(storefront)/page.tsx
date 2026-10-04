import HeroSection from "@/components/storefront/hero-section";
import NewArrivals from "@/components/storefront/new-arrivals";
import Bestsellers from "@/components/storefront/bestsellers";
import ShopByCategory from "@/components/storefront/shop-by-category";
import ShopByReels from "@/components/storefront/shop-by-reels";
import ViralProducts from "@/components/storefront/viral-products";
import UnderPrice from "@/components/storefront/under-price";
import Testimonials from "@/components/storefront/testimonials";
import Newsletter from "@/components/storefront/newsletter";
import { getHomepage } from "@/lib/services/homepage.service";

export default async function StorefrontHomePage() {
  const home = await getHomepage();

  return (
    <div className="flex flex-col min-h-screen w-full">
      <HeroSection slides={home.hero} />
      <NewArrivals products={home.newArrivals} />
      <ViralProducts products={home.viral} />
      <Bestsellers products={home.bestsellers} />
      <ShopByCategory categories={home.categories} />
      <ShopByReels reels={home.reels} />
      <UnderPrice maxPrice={home.underPrice.maxPrice} products={home.underPrice.products} />
      <Testimonials testimonials={home.testimonials} />
      <Newsletter />
    </div>
  );
}
