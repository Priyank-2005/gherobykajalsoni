import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { createCategorySchema } from "@/lib/validations/category";
import { adminListCategories, createCategory } from "@/lib/services/category.service";

/** All categories (including hidden) with subcategories and product counts. */
export const GET = adminRoute(async () => ok({ categories: await adminListCategories() }));

/** Create a category together with its subcategory list. */
export const POST = adminRoute(async (request: Request) => {
  const input = await parseBody(request, createCategorySchema);
  return ok({ category: await createCategory(input) }, { status: 201 });
});
