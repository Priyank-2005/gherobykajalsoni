import { handle, ok, notFound } from "@/lib/api";
import { getCategoryBySlug } from "@/lib/services/category.service";

export const GET = handle(async (_request: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const category = await getCategoryBySlug(slug);
  if (!category) throw notFound("Category not found");
  return ok({ category });
});
