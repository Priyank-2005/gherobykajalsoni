import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { createVariantSchema } from "@/lib/validations/product";
import { createVariant } from "@/lib/services/product.service";

export const POST = adminRoute(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const input = await parseBody(request, createVariantSchema);
  return ok({ variant: await createVariant(id, input) }, { status: 201 });
});
