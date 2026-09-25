import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

/**
 * Subcategory row as edited inline in the admin category form.
 * `id` present → update existing; absent → create. Rows omitted from the
 * submitted list are deleted (their products fall back to no subcategory).
 */
export const subcategoryInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, "Subcategory name is required").max(100),
  slug: slugSchema.optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isVisible: z.boolean().optional().default(true),
});

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1, "Category name is required").max(100),
    slug: slugSchema.optional(),
    description: z.string().optional(),
    displayOrder: z.number().int().min(0).optional().default(0),
    isVisible: z.boolean().optional().default(true),
    subcategories: z.array(subcategoryInputSchema).optional().default([]),
  })
  .refine(
    (data) => {
      const names = data.subcategories.map((s) => s.name.toLowerCase());
      return new Set(names).size === names.length;
    },
    { message: "Subcategory names must be unique within a category", path: ["subcategories"] }
  );

export const updateCategorySchema = createCategorySchema;

export type SubcategoryInput = z.infer<typeof subcategoryInputSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
