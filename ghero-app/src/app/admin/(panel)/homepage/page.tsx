import { heroAdmin, homepageCategoryAdmin, reelAdmin, testimonialAdmin } from "@/lib/services/homepage.service";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { HomepageEditor } from "./homepage-editor";

export const metadata = { title: "Homepage" };

const plain = <T,>(rows: T[]) => JSON.parse(JSON.stringify(rows)) as Record<string, unknown>[];

export default async function AdminHomepagePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const [hero, categories, reels, testimonials, categoryOptions, productOptions] = await Promise.all([
    heroAdmin.list(),
    homepageCategoryAdmin.list(),
    reelAdmin.list(),
    testimonialAdmin.list(),
    prisma.category.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.product.findMany({ where: { isPublished: true }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Homepage"
        description="New Arrivals and Bestsellers come from the product flags on each product. Everything else is managed here."
      />
      <HomepageEditor
        initialTab={tab}
        data={{ hero: plain(hero), categories: plain(categories), reels: plain(reels), testimonials: plain(testimonials) }}
        categoryOptions={categoryOptions}
        productOptions={productOptions}
      />
    </>
  );
}
