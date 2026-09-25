import { handle, ok, notFound } from "@/lib/api";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/product.service";

export const GET = handle(async (_request: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) throw notFound("Product not found");
  const related = await getRelatedProducts(product.id, product.category.id);
  return ok({ product, related });
});
