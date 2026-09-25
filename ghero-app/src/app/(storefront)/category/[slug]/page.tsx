import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/storefront/product-listing";
import { Breadcrumb } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { parseProductQuery } from "@/lib/validations/catalog";
import { getCategoryBySlug } from "@/lib/services/category.service";
import { listProducts } from "@/lib/services/product.service";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return { title: "Category not found" };
  const { sub } = await searchParams;
  const subcategory = category.subcategories.find((s) => s.slug === sub);
  const name = subcategory ? `${subcategory.name} | ${category.name}` : category.name;
  return {
    title: name,
    description: category.description ?? `Shop ${subcategory?.name ?? category.name} at Ghero by Kajal Soni.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const raw = await searchParams;
  // Unknown ?sub= values fall back to showing the whole category.
  const activeSubcategory = category.subcategories.find((s) => s.slug === raw.sub) ?? null;
  const query = { ...parseProductQuery(raw), category: category.slug, sub: activeSubcategory?.slug };
  const data = await listProducts(query);

  const title = activeSubcategory?.name ?? category.name;
  const chip = (active: boolean) =>
    cn(
      "px-4 py-1.5 rounded-full border text-sm transition-colors whitespace-nowrap",
      active ? "border-wine bg-wine text-white" : "border-gold/30 bg-white/60 text-charcoal/80 hover:border-wine hover:text-wine"
    );

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(activeSubcategory
            ? [{ label: category.name, href: `/category/${category.slug}` }, { label: activeSubcategory.name }]
            : [{ label: category.name }]),
        ]}
      />

      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-heading text-charcoal mb-4">{title}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto lg:mx-0">
          {category.description ?? `Explore our exclusive ${title} collection.`}
        </p>

        {/* Subcategory chips: horizontally scrollable on mobile */}
        {category.subcategories.length > 0 && (
          <div className="mt-6 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar lg:mx-0 lg:px-0 lg:flex-wrap">
            <Link href={`/category/${category.slug}`} scroll={false} className={chip(!activeSubcategory)}>
              All
            </Link>
            {category.subcategories.map((s) => (
              <Link key={s.id} href={`/category/${category.slug}?sub=${s.slug}`} scroll={false} className={chip(activeSubcategory?.id === s.id)}>
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ProductListing data={data} lockedCategory />
    </div>
  );
}
