import { z } from "zod";

/**
 * Product validation schemas for admin CRUD operations.
 * Update schemas are `.partial()` of a base WITHOUT defaults: Zod 4 still applies
 * `.default()` inside `.partial()`, which would silently reset flags on partial updates.
 */
const productBase = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(10000).nullable(),
  fabric: z.string().max(500).nullable(),
  careInstructions: z.string().max(5000).nullable(),
  sizeGuide: z.string().max(10000).nullable(),
  categoryId: z.string().min(1, "Category is required"),
  // Optional: some categories (e.g. Dresses / Custom Outfits) have no subcategories.
  // product.service verifies it belongs to categoryId.
  subcategoryId: z.string().min(1).nullable(),
  basePrice: z.number().positive("Price must be positive"),
  baseMrp: z.number().positive("MRP must be positive"),
  isBestseller: z.boolean(),
  isNewArrival: z.boolean(),
  isPublished: z.boolean(),
});

const mrpNotBelowPrice = (d: { basePrice?: number; baseMrp?: number }) =>
  d.basePrice === undefined || d.baseMrp === undefined || d.baseMrp >= d.basePrice;
const mrpMessage = { message: "MRP can't be lower than the selling price", path: ["baseMrp"] };

export const createProductSchema = productBase
  .extend({
    slug: productBase.shape.slug.optional(),
    description: productBase.shape.description.optional(),
    fabric: productBase.shape.fabric.optional(),
    careInstructions: productBase.shape.careInstructions.optional(),
    sizeGuide: productBase.shape.sizeGuide.optional(),
    subcategoryId: productBase.shape.subcategoryId.optional(),
    isBestseller: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isPublished: z.boolean().default(false),
  })
  .refine(mrpNotBelowPrice, mrpMessage);

export const updateProductSchema = productBase.partial().refine(mrpNotBelowPrice, mrpMessage);

const variantBase = z.object({
  sku: z.string().trim().toUpperCase().min(1, "SKU is required").max(50),
  size: z.string().trim().max(30).nullable(),
  color: z.string().trim().max(50).nullable(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").nullable(),
  price: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isAvailable: z.boolean(),
});

const variantMrp = (d: { price?: number; mrp?: number }) =>
  d.price === undefined || d.mrp === undefined || d.mrp >= d.price;
const variantMrpMessage = { message: "MRP can't be lower than the price", path: ["mrp"] };

export const createVariantSchema = variantBase
  .extend({
    size: variantBase.shape.size.optional(),
    color: variantBase.shape.color.optional(),
    colorHex: variantBase.shape.colorHex.optional(),
    isAvailable: z.boolean().default(true),
  })
  .refine(variantMrp, variantMrpMessage);

export const updateVariantSchema = variantBase.partial().refine(variantMrp, variantMrpMessage);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
