import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api";
import { listFeaturedProducts } from "./product.service";
import type {
  HeroInput,
  HomepageCategoryInput,
  ReelInput,
  TestimonialInput,
} from "@/lib/validations/homepage";

const visibleOrdered = { where: { isVisible: true }, orderBy: { displayOrder: "asc" as const } };

/** Everything the storefront homepage renders, in one call. */
export async function getHomepage() {
  const [hero, categories, reels, testimonials, newArrivals, bestsellers] = await Promise.all([
    prisma.homepageHero.findMany(visibleOrdered),
    prisma.homepageCategory.findMany({ ...visibleOrdered, where: { isVisible: true, OR: [{ categoryId: null }, { category: { isVisible: true } }] } }),
    prisma.homepageReel.findMany({ ...visibleOrdered, include: { product: { select: { slug: true, name: true } } } }),
    prisma.testimonial.findMany(visibleOrdered),
    listFeaturedProducts("new", 8),
    listFeaturedProducts("bestseller", 8),
  ]);
  return {
    hero: hero.map((h) => ({
      id: h.id,
      imageUrl: h.imageUrl,
      mobileImageUrl: h.mobileImageUrl,
      heading: h.heading,
      subheading: h.subheading,
      ctaText: h.ctaText,
      ctaUrl: h.ctaUrl,
      secondaryCtaText: h.secondaryCtaText,
      secondaryCtaUrl: h.secondaryCtaUrl,
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, imageUrl: c.imageUrl, link: c.link })),
    reels: reels.map((r) => ({
      id: r.id,
      mediaUrl: r.mediaUrl,
      mediaType: r.mediaType as "image" | "video",
      thumbnail: r.thumbnail,
      caption: r.caption,
      link: r.link ?? (r.product ? `/product/${r.product.slug}` : null),
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      customerName: t.customerName,
      review: t.review,
      rating: t.rating,
      imageUrl: t.imageUrl,
      productName: t.productName,
    })),
    newArrivals,
    bestsellers,
  };
}

export type HomepageData = Awaited<ReturnType<typeof getHomepage>>;

// ---------------------------------------------------------------------------
// Admin CRUD. Each section is a simple ordered list; deletes return the Cloudinary ids to purge.
// ---------------------------------------------------------------------------

const all = { orderBy: { displayOrder: "asc" as const } };

export const heroAdmin = {
  list: () => prisma.homepageHero.findMany(all),
  create: (data: HeroInput) => prisma.homepageHero.create({ data }),
  update: (id: string, data: Partial<HeroInput>) => prisma.homepageHero.update({ where: { id }, data }),
  async remove(id: string) {
    const row = await prisma.homepageHero.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Slide not found");
    return [row.imageCloudinaryId, row.mobileCloudinaryId].filter((v): v is string => Boolean(v));
  },
};

export const homepageCategoryAdmin = {
  list: () => prisma.homepageCategory.findMany(all),
  create: (data: HomepageCategoryInput) => prisma.homepageCategory.create({ data }),
  update: (id: string, data: Partial<HomepageCategoryInput>) => prisma.homepageCategory.update({ where: { id }, data }),
  async remove(id: string) {
    const row = await prisma.homepageCategory.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Tile not found");
    return [row.cloudinaryId];
  },
};

export const reelAdmin = {
  list: () => prisma.homepageReel.findMany(all),
  create: (data: ReelInput) => prisma.homepageReel.create({ data }),
  update: (id: string, data: Partial<ReelInput>) => prisma.homepageReel.update({ where: { id }, data }),
  async remove(id: string) {
    const row = await prisma.homepageReel.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Reel not found");
    return [row.cloudinaryId];
  },
};

export const testimonialAdmin = {
  list: () => prisma.testimonial.findMany(all),
  create: (data: TestimonialInput) => prisma.testimonial.create({ data }),
  update: (id: string, data: Partial<TestimonialInput>) => prisma.testimonial.update({ where: { id }, data }),
  async remove(id: string) {
    const row = await prisma.testimonial.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Testimonial not found");
    return [row.cloudinaryId].filter((v): v is string => Boolean(v));
  },
};
