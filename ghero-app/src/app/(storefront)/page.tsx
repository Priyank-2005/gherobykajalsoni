import HeroSection from "@/components/storefront/hero-section";
import NewArrivals from "@/components/storefront/new-arrivals";
import Bestsellers from "@/components/storefront/bestsellers";
import ShopByCategory from "@/components/storefront/shop-by-category";
import ShopByReels from "@/components/storefront/shop-by-reels";
import Testimonials from "@/components/storefront/testimonials";
import Newsletter from "@/components/storefront/newsletter";

export default function StorefrontHomePage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <HeroSection />
      <NewArrivals />
      <Bestsellers />
      <ShopByCategory />
      <ShopByReels />
      <Testimonials />
      <Newsletter />
    </div>
  );
}
