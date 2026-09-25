import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchase } from "@/components/storefront/product-purchase";
import { ProductAccordion } from "@/components/storefront/product-accordion";
import { ProductCard } from "@/components/storefront/product-card";
import { Breadcrumb } from "@/components/ui/feedback";
import { STORE_CONFIG } from "@/lib/config";
import { formatPrice } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/product.service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const description = product.description?.slice(0, 160) ?? `${product.name} from Ghero by Kajal Soni.`;
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.images[0] ? [{ url: product.images[0].url }] : undefined },
  };
}

function TextBlock({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n+/).map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.id, product.category.id);

  const accordionItems = [
    { title: "Description", content: <TextBlock text={product.description || "Elegant traditional wear crafted with precision and care."} /> },
    ...(product.fabric || product.careInstructions
      ? [
          {
            title: "Fabric & Care",
            content: (
              <div className="space-y-3">
                {product.fabric && (
                  <p>
                    <span className="font-medium text-charcoal">Fabric: </span>
                    {product.fabric}
                  </p>
                )}
                {product.careInstructions && <TextBlock text={product.careInstructions} />}
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Size Guide",
      content: (
        <div id="size-guide">
          <TextBlock text={product.sizeGuide || "Sizes follow our standard chart. For custom measurements, contact us on WhatsApp before ordering."} />
        </div>
      ),
    },
    {
      title: "Shipping & Returns",
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Free shipping on orders above {formatPrice(STORE_CONFIG.freeShippingThreshold)}</li>
          <li>Delivery within 5–7 business days</li>
          <li>
            See our{" "}
            <Link href="/refund-policy" className="underline hover:text-wine">
              refund policy
            </Link>{" "}
            for returns and exchanges
          </li>
        </ul>
      ),
    },
  ];

  // Structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Ghero by Kajal Soni" },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: v.price,
      priceCurrency: "INR",
      availability: v.isAvailable && v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb
        className="hidden md:block"
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.category.name, href: `/category/${product.category.slug}` },
          ...(product.subcategory
            ? [{ label: product.subcategory.name, href: `/category/${product.category.slug}?sub=${product.subcategory.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        <div className="w-full lg:w-[45%]">
          <ProductGallery name={product.name} images={product.images} videos={product.videos} />
        </div>

        <div className="w-full lg:w-[55%] flex flex-col">
          <Link
            href={
              product.subcategory
                ? `/category/${product.category.slug}?sub=${product.subcategory.slug}`
                : `/category/${product.category.slug}`
            }
            className="text-sm text-wine tracking-widest uppercase font-medium mb-2 inline-block hover:underline self-start"
          >
            {product.subcategory?.name ?? product.category.name}
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading text-charcoal mb-2 leading-tight">{product.name}</h1>

          <ProductPurchase productName={product.name} variants={product.variants} />

          <ProductAccordion items={accordionItems} />

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: Check, label: "100% Authentic" },
              { icon: ShieldCheck, label: "Secure Checkout" },
              { icon: Truck, label: "Pan-India Delivery" },
              { icon: RotateCcw, label: "7-Day Exchanges" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="p-4 bg-cream/50 rounded-sm">
                <Icon className="w-5 h-5 mx-auto mb-2 text-wine" aria-hidden />
                <span className="text-xs font-medium text-charcoal block">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-gold/20">
          <h2 className="font-heading text-3xl text-gold text-center mb-10">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
