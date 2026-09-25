import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { resolveSection } from "../sections";

type Ctx = { params: Promise<{ section: string }> };

/** section: hero | categories | reels | testimonials */
export const GET = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { admin } = resolveSection((await ctx.params).section);
  return ok({ items: await admin.list() });
});

export const POST = adminRoute(async (request: Request, ctx: Ctx) => {
  const { admin, schema } = resolveSection((await ctx.params).section);
  const input = await parseBody(request, schema);
  return ok({ item: await admin.create(input as never) }, { status: 201 });
});
