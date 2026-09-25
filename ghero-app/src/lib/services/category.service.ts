import { cache } from "react";
import { prisma } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/api";
import { slugify } from "@/lib/utils";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/category";
import type { CategoryWithSubcategories } from "@/types/product";

const subcategoryOrder = { orderBy: [{ displayOrder: "asc" as const }, { name: "asc" as const }] };

/** Visible categories with their visible subcategories, for navigation and filters. */
export const listCategories = cache(async (): Promise<CategoryWithSubcategories[]> => {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: { where: { isVisible: true }, ...subcategoryOrder, select: { id: true, name: true, slug: true } },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    subcategories: c.subcategories,
  }));
});

/** Cached per request: generateMetadata and the page share one lookup. */
export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await prisma.category.findFirst({
    where: { slug, isVisible: true },
    include: {
      subcategories: { where: { isVisible: true }, ...subcategoryOrder, select: { id: true, name: true, slug: true } },
    },
  });
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    subcategories: category.subcategories,
  };
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function adminListCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: {
        ...subcategoryOrder,
        include: { _count: { select: { products: true } } },
      },
      _count: { select: { products: true } },
    },
  });
  return categories.map(({ _count, subcategories, ...c }) => ({
    ...c,
    productCount: _count.products,
    subcategories: subcategories.map(({ _count: sc, ...s }) => ({ ...s, productCount: sc.products })),
  }));
}

function uniqueSlugs<T extends { name: string; slug?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.map((item) => {
    const slug = item.slug || slugify(item.name);
    if (!slug) throw badRequest(`"${item.name}" can't be turned into a URL slug`);
    if (seen.has(slug)) throw badRequest(`Two subcategories would share the slug "${slug}"`);
    seen.add(slug);
    return { ...item, slug };
  });
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug || slugify(input.name);
  if (await prisma.category.findUnique({ where: { slug } })) {
    throw conflict(`A category with the slug "${slug}" already exists`);
  }
  const subcategories = uniqueSlugs(input.subcategories);

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      displayOrder: input.displayOrder,
      isVisible: input.isVisible,
      subcategories: {
        create: subcategories.map((s, i) => ({
          name: s.name,
          slug: s.slug,
          displayOrder: s.displayOrder || i,
          isVisible: s.isVisible,
        })),
      },
    },
    include: { subcategories: subcategoryOrder },
  });
}

/**
 * Replace a category and its subcategory list in one transaction.
 * Subcategory rows with an id are updated, rows without are created, and existing rows
 * missing from the list are deleted (their products keep the category, lose the subcategory).
 */
export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id }, include: { subcategories: true } });
  if (!existing) throw notFound("Category not found");

  const slug = input.slug || slugify(input.name);
  if (slug !== existing.slug && (await prisma.category.findUnique({ where: { slug } }))) {
    throw conflict(`A category with the slug "${slug}" already exists`);
  }

  const subcategories = uniqueSlugs(input.subcategories);
  const existingIds = new Set(existing.subcategories.map((s) => s.id));
  for (const s of subcategories) {
    if (s.id && !existingIds.has(s.id)) throw badRequest("A subcategory does not belong to this category");
  }
  const keepIds = new Set(subcategories.filter((s) => s.id).map((s) => s.id!));
  const deleteIds = [...existingIds].filter((sid) => !keepIds.has(sid));

  return prisma.$transaction(async (tx) => {
    // Delete removed rows first so their slugs can be reused by renamed/new rows.
    if (deleteIds.length) await tx.subcategory.deleteMany({ where: { id: { in: deleteIds } } });

    // Two-phase slug update avoids transient unique collisions when admins swap names.
    for (const s of subcategories.filter((s) => s.id)) {
      await tx.subcategory.update({ where: { id: s.id }, data: { slug: `__tmp_${s.id}` } });
    }
    for (const [i, s] of subcategories.entries()) {
      const data = { name: s.name, slug: s.slug, displayOrder: s.displayOrder || i, isVisible: s.isVisible };
      if (s.id) await tx.subcategory.update({ where: { id: s.id }, data });
      else await tx.subcategory.create({ data: { ...data, categoryId: id } });
    }

    return tx.category.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        displayOrder: input.displayOrder,
        isVisible: input.isVisible,
      },
      include: { subcategories: subcategoryOrder },
    });
  });
}

export async function setCategoryImage(id: string, image: { url: string; cloudinaryId: string } | null) {
  return prisma.category.update({
    where: { id },
    data: { image: image?.url ?? null, cloudinaryId: image?.cloudinaryId ?? null },
  });
}

/** Categories with products can't be deleted (products require a category); hide them instead. */
export async function deleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw conflict(`This category has ${count} product${count === 1 ? "" : "s"}. Move them or hide the category instead.`);
  }
  const category = await prisma.category.delete({ where: { id } });
  return { id: category.id, cloudinaryId: category.cloudinaryId };
}
