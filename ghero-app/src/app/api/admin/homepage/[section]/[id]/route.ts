import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { deleteMedia } from "@/lib/services/media.service";
import { resolveSection } from "../../sections";

type Ctx = { params: Promise<{ section: string; id: string }> };

export const PUT = adminRoute(async (request: Request, ctx: Ctx) => {
  const { section, id } = await ctx.params;
  const { admin, updateSchema } = resolveSection(section);
  const input = await parseBody(request, updateSchema);
  return ok({ item: await admin.update(id, input as never) });
});

export const DELETE = adminRoute(async (_request: Request, ctx: Ctx) => {
  const { section, id } = await ctx.params;
  await deleteMedia(await resolveSection(section).admin.remove(id));
  return ok({ success: true });
});
