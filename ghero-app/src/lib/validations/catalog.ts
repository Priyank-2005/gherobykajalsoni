import { z } from "zod";
import { PRODUCT_SORT_OPTIONS } from "@/types/product";

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined));

const optionalNumber = z.coerce.number().nonnegative().optional().catch(undefined);

/**
 * Query-string schema for product listing (/api/products and the shop/category pages).
 * Invalid values are dropped rather than erroring, so a hand-edited URL still renders.
 */
export const productQuerySchema = z.object({
  category: z.string().optional(),
  sub: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  sizes: csv,
  colors: csv,
  inStock: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  minDiscount: optionalNumber,
  sort: z
    .enum(PRODUCT_SORT_OPTIONS.map((o) => o.value) as [string, ...string[]])
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  pageSize: z.coerce.number().int().min(1).max(48).optional().catch(undefined),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

/** Accepts URLSearchParams or a Next.js searchParams record. */
export function parseProductQuery(params: URLSearchParams | Record<string, string | string[] | undefined>) {
  const record: Record<string, string> = {};
  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => (record[key] = value));
  } else {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") record[key] = value;
      else if (Array.isArray(value) && value[0]) record[key] = value[0];
    }
  }
  return productQuerySchema.parse(record);
}
