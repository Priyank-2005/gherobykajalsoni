import { handle, ok } from "@/lib/api";
import { parseProductQuery } from "@/lib/validations/catalog";
import { listProducts } from "@/lib/services/product.service";

/** Query: category, sub, q, minPrice, maxPrice, sizes (csv), colors (csv), inStock=1, minDiscount, sort, page, pageSize */
export const GET = handle(async (request: Request) => {
  const query = parseProductQuery(new URL(request.url).searchParams);
  return ok(await listProducts(query));
});
