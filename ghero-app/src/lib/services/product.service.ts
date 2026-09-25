import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/api";
import { toNumber } from "@/lib/money";
import { calculateDiscount, slugify } from "@/lib/utils";
import type { ProductQuery } from "@/lib/validations/catalog";
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from "@/lib/validations/product";
import type {
  ProductCardData,
  ProductDetail,
  ProductFacets,
  ProductListResponse,
  ProductSortOption,
} from "@/types/product";

const DEFAULT_PAGE_SIZE = 12;

const cardInclude = {
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { displayOrder: "asc" as const }, take: 2, select: { url: true } },
  variants: { select: { stock: true, isAvailable: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: CardRow): ProductCardData {
  const basePrice = toNumber(p.basePrice);
  const baseMrp = toNumber(p.baseMrp);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    subcategory: p.subcategory,
    images: p.images.map((i) => i.url),
    basePrice,
    baseMrp,
    discount: calculateDiscount(baseMrp, basePrice),
    isBestseller: p.isBestseller,
    isNewArrival: p.isNewArrival,
    inStock: p.variants.some((v) => v.isAvailable && v.stock > 0),
  };
}

async function cardsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: cardInclude });
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => byId.get(id)).filter((c): c is ProductCardData => Boolean(c));
}

function searchWhere(q: string): Prisma.ProductWhereInput {
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { name: contains },
      { description: contains },
      { fabric: contains },
      { category: { name: contains } },
      { subcategory: { name: contains } },
      { variants: { some: { sku: contains } } },
      { variants: { some: { color: contains } } },
    ],
  };
}

/** Scope = everything except the attribute filters, so facets show what's available to pick. */
function scopeWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isPublished: true }];
  if (query.category) and.push({ category: { slug: query.category, isVisible: true } });
  if (query.category && query.sub) and.push({ subcategory: { slug: query.sub } });
  if (query.q) and.push(searchWhere(query.q));
  return { AND: and };
}

function filterWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [scopeWhere(query)];
  if (query.minPrice !== undefined) and.push({ basePrice: { gte: query.minPrice } });
  if (query.maxPrice !== undefined) and.push({ basePrice: { lte: query.maxPrice } });
  if (query.sizes?.length) and.push({ variants: { some: { size: { in: query.sizes } } } });
  if (query.colors?.length) and.push({ variants: { some: { color: { in: query.colors } } } });
  if (query.inStock) and.push({ variants: { some: { isAvailable: true, stock: { gt: 0 } } } });
  return { AND: and };
}

async function facetsFor(scope: Prisma.ProductWhereInput): Promise<ProductFacets> {
  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: scope,
      select: { basePrice: true, category: { select: { slug: true, name: true, displayOrder: true } } },
    }),
    prisma.productVariant.findMany({
      where: { product: scope },
      select: { size: true, color: true, colorHex: true },
    }),
  ]);

  const categories = new Map<string, { slug: string; name: string; count: number; order: number }>();
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    const c = categories.get(p.category.slug) ?? { ...p.category, count: 0, order: p.category.displayOrder };
    c.count++;
    categories.set(p.category.slug, c);
    const price = toNumber(p.basePrice);
    min = Math.min(min, price);
    max = Math.max(max, price);
  }

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
  const sizes = [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))].sort(
    (a, b) => (SIZE_ORDER.indexOf(a) + 1 || 99) - (SIZE_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b)
  );
  const colors = new Map<string, string>();
  for (const v of variants) if (v.color && !colors.has(v.color)) colors.set(v.color, v.colorHex || "#cccccc");

  return {
    categories: [...categories.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ slug, name, count }) => ({ slug, name, count })),
    sizes,
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    priceRange: { min: products.length ? min : 0, max },
  };
}

type LightRow = {
  id: string;
  basePrice: Prisma.Decimal;
  baseMrp: Prisma.Decimal;
  createdAt: Date;
  isBestseller: boolean;
  isNewArrival: boolean;
};

function sortRows(rows: (LightRow & { discount: number })[], sort: ProductSortOption) {
  const price = (r: LightRow) => toNumber(r.basePrice);
  const newest = (a: LightRow, b: LightRow) => b.createdAt.getTime() - a.createdAt.getTime();
  const cmp: Record<ProductSortOption, (a: LightRow & { discount: number }, b: LightRow & { discount: number }) => number> = {
    recommended: (a, b) =>
      Number(b.isBestseller) - Number(a.isBestseller) || Number(b.isNewArrival) - Number(a.isNewArrival) || newest(a, b),
    newest,
    price_low_to_high: (a, b) => price(a) - price(b) || newest(a, b),
    price_high_to_low: (a, b) => price(b) - price(a) || newest(a, b),
    bestseller: (a, b) => Number(b.isBestseller) - Number(a.isBestseller) || newest(a, b),
    discount: (a, b) => b.discount - a.discount || newest(a, b),
  };
  return rows.sort(cmp[sort]);
}

/**
 * Filtered, sorted, paginated product listing with facets.
 * Discount is derived (MRP vs price), so filtering/sorting runs over lightweight rows and only
 * the requested page is hydrated. Fine for catalogs up to several thousand products.
 */
export async function listProducts(query: ProductQuery): Promise<ProductListResponse> {
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = (query.sort ?? "recommended") as ProductSortOption;

  const [rows, facets] = await Promise.all([
    prisma.product.findMany({
      where: filterWhere(query),
      select: { id: true, basePrice: true, baseMrp: true, createdAt: true, isBestseller: true, isNewArrival: true },
    }),
    facetsFor(scopeWhere(query)),
  ]);

  let withDiscount = rows.map((r) => ({
    ...r,
    discount: calculateDiscount(toNumber(r.baseMrp), toNumber(r.basePrice)),
  }));
  if (query.minDiscount) withDiscount = withDiscount.filter((r) => r.discount >= query.minDiscount!);
  sortRows(withDiscount, sort);

  const total = withDiscount.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page ?? 1, totalPages);
  const pageIds = withDiscount.slice((page - 1) * pageSize, page * pageSize).map((r) => r.id);

  return { products: await cardsByIds(pageIds), total, page, pageSize, totalPages, facets };
}

export async function listFeaturedProducts(kind: "new" | "bestseller", limit = 8) {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, ...(kind === "new" ? { isNewArrival: true } : { isBestseller: true }) },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: cardInclude,
  });
  return rows.map(toCard);
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, categoryId, id: { not: productId } },
    orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: cardInclude,
  });
  return rows.map(toCard);
}

/** Lightweight autocomplete: matching products and categories. */
export async function searchSuggestions(q: string) {
  const term = q.trim();
  if (term.length < 2) return { products: [], categories: [] };
  const contains = { contains: term, mode: "insensitive" as const };
  const [products, categories, subcategories] = await Promise.all([
    prisma.product.findMany({
      where: { AND: [{ isPublished: true }, searchWhere(term)] },
      orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        name: true,
        slug: true,
        basePrice: true,
        images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    prisma.category.findMany({ where: { isVisible: true, name: contains }, take: 3, select: { name: true, slug: true } }),
    prisma.subcategory.findMany({
      where: { isVisible: true, name: contains, category: { isVisible: true } },
      take: 3,
      select: { name: true, slug: true, category: { select: { slug: true, name: true } } },
    }),
  ]);
  return {
    products: products.map((p) => ({
      name: p.name,
      slug: p.slug,
      price: toNumber(p.basePrice),
      imageUrl: p.images[0]?.url ?? null,
    })),
    categories: [
      ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
      ...subcategories.map((s) => ({
        label: `${s.name} in ${s.category.name}`,
        href: `/category/${s.category.slug}?sub=${s.slug}`,
      })),
    ],
  };
}

/** Cached per request: generateMetadata and the page share one lookup. */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const p = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { displayOrder: "asc" } },
      videos: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    fabric: p.fabric,
    careInstructions: p.careInstructions,
    sizeGuide: p.sizeGuide,
    basePrice: toNumber(p.basePrice),
    baseMrp: toNumber(p.baseMrp),
    category: p.category,
    subcategory: p.subcategory,
    isBestseller: p.isBestseller,
    isNewArrival: p.isNewArrival,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      price: toNumber(v.price),
      mrp: toNumber(v.mrp),
      stock: v.stock,
      isAvailable: v.isAvailable,
    })),
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    videos: p.videos.map((v) => ({ id: v.id, url: v.url, thumbnail: v.thumbnail })),
  };
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function assertCategoryPair(categoryId: string, subcategoryId: string | null | undefined) {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw badRequest("Selected category does not exist");
  if (subcategoryId) {
    const sub = await prisma.subcategory.findUnique({ where: { id: subcategoryId }, select: { categoryId: true } });
    if (!sub || sub.categoryId !== categoryId) {
      throw badRequest("Selected subcategory does not belong to the selected category");
    }
  }
}

async function uniqueProductSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "product";
  let slug = root;
  for (let i = 2; ; i++) {
    const clash = await prisma.product.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
}

export async function adminListProducts(params: { q?: string; categoryId?: string; page?: number; pageSize?: number }) {
  const pageSize = params.pageSize ?? 20;
  const page = params.page ?? 1;
  const where: Prisma.ProductWhereInput = {
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.q ? searchWhere(params.q) : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } },
        variants: { select: { stock: true } },
      },
    }),
  ]);
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name,
      subcategory: p.subcategory?.name ?? null,
      basePrice: toNumber(p.basePrice),
      baseMrp: toNumber(p.baseMrp),
      totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
      variantCount: p.variants.length,
      isPublished: p.isPublished,
      isBestseller: p.isBestseller,
      isNewArrival: p.isNewArrival,
      imageUrl: p.images[0]?.url ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

export async function adminGetProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      subcategory: true,
      variants: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { displayOrder: "asc" } },
      videos: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!product) throw notFound("Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  await assertCategoryPair(input.categoryId, input.subcategoryId);
  if (input.slug && (await prisma.product.findUnique({ where: { slug: input.slug } }))) {
    throw conflict(`The slug "${input.slug}" is already used by another product`);
  }
  const slug = input.slug ?? (await uniqueProductSlug(input.name));
  return prisma.product.create({ data: { ...input, subcategoryId: input.subcategoryId ?? null, slug } });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { categoryId: true, subcategoryId: true } });
  if (!existing) throw notFound("Product not found");

  const categoryId = input.categoryId ?? existing.categoryId;
  // Changing category without choosing a new subcategory clears the old (now mismatched) one.
  const subcategoryId =
    input.subcategoryId !== undefined
      ? input.subcategoryId
      : input.categoryId && input.categoryId !== existing.categoryId
        ? null
        : existing.subcategoryId;
  await assertCategoryPair(categoryId, subcategoryId);

  if (input.slug) {
    const clash = await prisma.product.findFirst({ where: { slug: input.slug, id: { not: id } } });
    if (clash) throw conflict(`The slug "${input.slug}" is already used by another product`);
  }
  return prisma.product.update({ where: { id }, data: { ...input, categoryId, subcategoryId } });
}

/** Hard delete. Order history is unaffected (orders store snapshots). Returns media ids for cleanup. */
export async function deleteProduct(id: string) {
  const media = await prisma.product.findUnique({
    where: { id },
    select: { images: { select: { cloudinaryId: true } }, videos: { select: { cloudinaryId: true } } },
  });
  if (!media) throw notFound("Product not found");
  await prisma.product.delete({ where: { id } });
  return [...media.images, ...media.videos].map((m) => m.cloudinaryId);
}

export async function createVariant(productId: string, input: CreateVariantInput) {
  if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
    throw notFound("Product not found");
  }
  return prisma.productVariant.create({ data: { ...input, productId } });
}

export async function updateVariant(productId: string, variantId: string, input: UpdateVariantInput) {
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw notFound("Variant not found");
  return prisma.productVariant.update({ where: { id: variantId }, data: input });
}

export async function deleteVariant(productId: string, variantId: string) {
  const deleted = await prisma.productVariant.deleteMany({ where: { id: variantId, productId } });
  if (!deleted.count) throw notFound("Variant not found");
}

export async function addProductMedia(
  productId: string,
  kind: "image" | "video",
  media: { url: string; cloudinaryId: string; alt?: string; thumbnail?: string }
) {
  if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
    throw notFound("Product not found");
  }
  if (kind === "image") {
    const count = await prisma.productImage.count({ where: { productId } });
    return prisma.productImage.create({
      data: { productId, url: media.url, cloudinaryId: media.cloudinaryId, alt: media.alt, displayOrder: count },
    });
  }
  const count = await prisma.productVideo.count({ where: { productId } });
  return prisma.productVideo.create({
    data: { productId, url: media.url, cloudinaryId: media.cloudinaryId, thumbnail: media.thumbnail, displayOrder: count },
  });
}

export async function reorderProductImages(productId: string, imageIds: string[]) {
  const images = await prisma.productImage.findMany({ where: { productId }, select: { id: true } });
  const owned = new Set(images.map((i) => i.id));
  if (imageIds.length !== owned.size || imageIds.some((id) => !owned.has(id))) {
    throw badRequest("Image list must contain every image of this product exactly once");
  }
  await prisma.$transaction(
    imageIds.map((id, i) => prisma.productImage.update({ where: { id }, data: { displayOrder: i } }))
  );
}

export async function deleteProductMedia(productId: string, kind: "image" | "video", mediaId: string) {
  const row =
    kind === "image"
      ? await prisma.productImage.findFirst({ where: { id: mediaId, productId } })
      : await prisma.productVideo.findFirst({ where: { id: mediaId, productId } });
  if (!row) throw notFound("Media not found");
  if (kind === "image") await prisma.productImage.delete({ where: { id: mediaId } });
  else await prisma.productVideo.delete({ where: { id: mediaId } });
  return row.cloudinaryId;
}
