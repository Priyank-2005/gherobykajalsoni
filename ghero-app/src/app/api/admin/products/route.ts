import { ok, parseBody } from "@/lib/api";
import { adminRoute, intParam } from "@/lib/admin-api";
import { createProductSchema } from "@/lib/validations/product";
import { adminListProducts, createProduct } from "@/lib/services/product.service";

/** Query: q, categoryId, page, pageSize. Includes unpublished products. */
export const GET = adminRoute(async (request: Request) => {
  const p = new URL(request.url).searchParams;
  return ok(
    await adminListProducts({
      q: p.get("q")?.trim() || undefined,
      categoryId: p.get("categoryId") || undefined,
      page: intParam(p.get("page"), 1),
      pageSize: intParam(p.get("pageSize"), 20, 100),
    })
  );
});

export const POST = adminRoute(async (request: Request) => {
  const input = await parseBody(request, createProductSchema);
  return ok({ product: await createProduct(input) }, { status: 201 });
});
