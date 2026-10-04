import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { updateStaffSchema } from "@/lib/validations/pos";
import { updateStaff } from "@/lib/services/staff.service";

/** Change name / role / PIN / discount limit / password, or (de)activate a staff member. */
export const PATCH = adminRoute(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  await updateStaff(id, await parseBody(request, updateStaffSchema));
  return ok({ success: true });
});
