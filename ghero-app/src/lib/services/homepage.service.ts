import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api";
import { BUDGET_PRICE_LIMIT } from "@/lib/constants";
import { listFeaturedProducts, listProductsUnderPrice, listViralProducts } from "./product.service";
import type {
  HeroInput,
  HomepageCategoryInput,
  ReelInput,
  TestimonialInput,
} from "@/lib/validations/homepage";

const visibleOrdered = { where: { isVisible: true }, orderBy: { displayOrder: "asc" as const } };

/** Everything the storefront homepage renders, in one call. */
export async function getHomepage() {
  const [hero, categories, reels, testimonials, newArrivals, bestsellers, viral, underPrice] = await Promise.all([
    prisma.homepageHero.findMany(visibleOrdered),
    prisma.homepageCategory.findMany({ ...visibleOrdered, where: { isVisible: true, OR: [{ categoryId: null }, { category: { isVisible: true } }] } }),
    prisma.homepageReel.findMany({ ...visibleOrdered, include: { product: { select: { slug: true, name: true } } } }),
    prisma.testimonial.findMany(visibleOrdered),
    listFeaturedProducts("new", 8),
    listFeaturedProducts("bestseller", 8),
    listViralProducts(12),
    listProductsUnderPrice(BUDGET_PRICE_LIMIT, 8),
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
    viral,
    underPrice: { maxPrice: BUDGET_PRICE_LIMIT, products: underPrice },
  };
}

export type HomepageData = Awaited<ReturnType<typeof getHomepage>>;

// ---------------------------------------------------------------------------
// Admin CRUD. Each section is a simple ordered list; updates and deletes return the Cloudinary
// ids that are no longer used, so the route can purge them.
// ---------------------------------------------------------------------------

const all = { orderBy: { displayOrder: "asc" as const } };

/** Cloudinary ids that an update replaced or removed (to purge after saving). */
function replacedMedia(before: (string | null)[], after: (string | null)[]) {
  return before.filter((id): id is string => Boolean(id) && !after.includes(id));
}

export const heroAdmin = {
  list: () => prisma.homepageHero.findMany(all),
  create: (data: HeroInput) => prisma.homepageHero.create({ data }),
  async update(id: string, data: Partial<HeroInput>) {
    const old = await prisma.homepageHero.findUnique({ where: { id } });
    if (!old) throw notFound("Slide not found");
    const item = await prisma.homepageHero.update({ where: { id }, data });
    return { item, stale: replacedMedia([old.imageCloudinaryId, old.mobileCloudinaryId], [item.imageCloudinaryId, item.mobileCloudinaryId]) };
  },
  async remove(id: string) {
    const row = await prisma.homepageHero.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Slide not found");
    return [row.imageCloudinaryId, row.mobileCloudinaryId].filter((v): v is string => Boolean(v));
  },
};

export const homepageCategoryAdmin = {
  list: () => prisma.homepageCategory.findMany(all),
  create: (data: HomepageCategoryInput) => prisma.homepageCategory.create({ data }),
  async update(id: string, data: Partial<HomepageCategoryInput>) {
    const old = await prisma.homepageCategory.findUnique({ where: { id } });
    if (!old) throw notFound("Tile not found");
    const item = await prisma.homepageCategory.update({ where: { id }, data });
    return { item, stale: replacedMedia([old.cloudinaryId], [item.cloudinaryId]) };
  },
  async remove(id: string) {
    const row = await prisma.homepageCategory.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Tile not found");
    return [row.cloudinaryId];
  },
};

export const reelAdmin = {
  list: () => prisma.homepageReel.findMany(all),
  create: (data: ReelInput) => prisma.homepageReel.create({ data }),
  async update(id: string, data: Partial<ReelInput>) {
    const old = await prisma.homepageReel.findUnique({ where: { id } });
    if (!old) throw notFound("Reel not found");
    const item = await prisma.homepageReel.update({ where: { id }, data });
    return { item, stale: replacedMedia([old.cloudinaryId], [item.cloudinaryId]) };
  },
  async remove(id: string) {
    const row = await prisma.homepageReel.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Reel not found");
    return [row.cloudinaryId];
  },
};

export const testimonialAdmin = {
  list: () => prisma.testimonial.findMany(all),
  create: (data: TestimonialInput) => prisma.testimonial.create({ data }),
  async update(id: string, data: Partial<TestimonialInput>) {
    const old = await prisma.testimonial.findUnique({ where: { id } });
    if (!old) throw notFound("Testimonial not found");
    const item = await prisma.testimonial.update({ where: { id }, data });
    return { item, stale: replacedMedia([old.cloudinaryId], [item.cloudinaryId]) };
  },
  async remove(id: string) {
    const row = await prisma.testimonial.delete({ where: { id } }).catch(() => null);
    if (!row) throw notFound("Testimonial not found");
    return [row.cloudinaryId].filter((v): v is string => Boolean(v));
  },
};
