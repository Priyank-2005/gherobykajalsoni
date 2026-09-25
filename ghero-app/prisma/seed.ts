/**
 * Idempotent seed: safe to run repeatedly (`npm run db:seed`).
 * Upserts by natural keys (slug / sku / code / email), so re-running updates rather than duplicates.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DUMMY_CATEGORIES,
  DUMMY_PRODUCTS,
  HERO_SLIDES,
  DUMMY_TESTIMONIALS,
  DUMMY_REELS,
} from "./seed-data.ts";

const prisma = new PrismaClient();

// Local /public assets have no Cloudinary id; this marker lets media cleanup skip them.
const LOCAL_ASSET = "local";

async function seedCatalog() {
  const categoryIds = new Map<string, string>();
  const subcategoryIds = new Map<string, string>(); // key: `${categorySlug}/${subSlug}`

  for (const [i, cat] of DUMMY_CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image, displayOrder: i },
      create: { name: cat.name, slug: cat.slug, image: cat.image, displayOrder: i },
    });
    categoryIds.set(cat.slug, category.id);

    for (const [j, sub] of cat.subcategories.entries()) {
      const subcategory = await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: sub.slug } },
        update: { name: sub.name, displayOrder: j },
        create: { categoryId: category.id, name: sub.name, slug: sub.slug, displayOrder: j },
      });
      subcategoryIds.set(`${cat.slug}/${sub.slug}`, subcategory.id);
    }
  }

  for (const p of DUMMY_PRODUCTS) {
    const data = {
      name: p.name,
      description: p.description,
      fabric: p.fabric,
      careInstructions: p.careInstructions,
      categoryId: categoryIds.get(p.category.slug)!,
      subcategoryId: p.subcategory ? subcategoryIds.get(`${p.category.slug}/${p.subcategory.slug}`) ?? null : null,
      basePrice: p.basePrice,
      baseMrp: p.baseMrp,
      isBestseller: p.isBestseller,
      isNewArrival: p.isNewArrival,
      isPublished: true,
    };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug },
    });

    for (const v of p.variants) {
      const variant = {
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        isAvailable: true,
      };
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: variant,
        create: { ...variant, sku: v.sku, productId: product.id },
      });
    }

    // Images have no natural key; replace the set wholesale.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((url, i) => ({
        productId: product.id,
        url,
        cloudinaryId: LOCAL_ASSET,
        alt: p.name,
        displayOrder: i,
      })),
    });
  }

  return { categoryIds };
}

async function seedHomepage(categoryIds: Map<string, string>) {
  // Singleton-ish CMS rows without natural keys: replace wholesale.
  await prisma.homepageHero.deleteMany();
  await prisma.homepageHero.createMany({
    data: HERO_SLIDES.map((slide, i) => ({ ...slide, imageCloudinaryId: LOCAL_ASSET, displayOrder: i })),
  });

  await prisma.homepageCategory.deleteMany();
  await prisma.homepageCategory.createMany({
    data: DUMMY_CATEGORIES.map((c, i) => ({
      categoryId: categoryIds.get(c.slug),
      name: c.name,
      imageUrl: c.image,
      cloudinaryId: LOCAL_ASSET,
      link: `/category/${c.slug}`,
      displayOrder: i,
    })),
  });

  const products = await prisma.product.findMany({
    where: { slug: { in: DUMMY_REELS.map((r) => r.productSlug) } },
    select: { id: true, slug: true },
  });
  const productIds = new Map(products.map((p) => [p.slug, p.id]));
  await prisma.homepageReel.deleteMany();
  await prisma.homepageReel.createMany({
    data: DUMMY_REELS.map((r, i) => ({
      mediaUrl: r.image,
      cloudinaryId: LOCAL_ASSET,
      mediaType: "image",
      caption: r.caption,
      productId: productIds.get(r.productSlug),
      link: `/product/${r.productSlug}`,
      displayOrder: i,
    })),
  });

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: DUMMY_TESTIMONIALS.map((t, i) => ({
      customerName: t.customerName,
      review: t.review,
      rating: t.rating,
      productName: t.productName,
      displayOrder: i,
    })),
  });
}

async function seedCoupons() {
  const coupons = [
    { code: "WELCOME10", type: "PERCENTAGE", applyOn: "CART_VALUE", discountValue: 10, maxDiscount: 1000, minCartValue: 1999, perUserLimit: 1 },
    { code: "FLAT500", type: "FLAT", applyOn: "CART_VALUE", discountValue: 500, maxDiscount: null, minCartValue: 4999, perUserLimit: 1 },
  ] as const;
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: { ...c } });
  }
}

/**
 * Admin account: email + bcrypt(ADMIN_PASSWORD). Re-running the seed after changing
 * ADMIN_PASSWORD in .env rotates the password.
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email) {
    console.warn("ADMIN_EMAIL not set; skipping admin user.");
    return;
  }
  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be set in .env and be at least 12 characters.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name: "Kajal Soni", role: "ADMIN", passwordHash },
  });
}

async function main() {
  const { categoryIds } = await seedCatalog();
  await seedHomepage(categoryIds);
  await seedCoupons();
  await seedAdmin();

  const counts = {
    categories: await prisma.category.count(),
    subcategories: await prisma.subcategory.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    coupons: await prisma.coupon.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
