import { handle, ok } from "@/lib/api";
import { parseProductQuery } from "@/lib/validations/catalog";
import { listProducts, searchSuggestions } from "@/lib/services/product.service";

/**
 * GET /api/search?q=...            full results (same shape as /api/products, supports its filters)
 * GET /api/search?q=...&suggest=1  lightweight autocomplete (products + categories)
 */
export const GET = handle(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  if (params.get("suggest") === "1") return ok(await searchSuggestions(q.slice(0, 100)));
  if (!q) return ok({ products: [], total: 0, page: 1, pageSize: 12, totalPages: 1, facets: null });
  return ok(await listProducts(parseProductQuery(params)));
});
