import { z } from "zod";

/**
 * Product validation schemas for admin CRUD operations.
 */
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  description: z.string().optional(),
  fabric: z.string().optional(),
  careInstructions: z.string().optional(),
  sizeGuide: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.number().positive("Price must be positive"),
  baseMrp: z.number().positive("MRP must be positive"),
  isBestseller: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
  price: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isAvailable: z.boolean().optional().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
