import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { createStaffSchema } from "@/lib/validations/pos";
import { adminListStaff, createStaff } from "@/lib/services/staff.service";

export const GET = adminRoute(async () => ok(await adminListStaff()));

/** Add a POS staff member (manager / cashier) with a PIN. */
export const POST = adminRoute(async (request: Request) => {
  const input = await parseBody(request, createStaffSchema);
  return ok({ staff: await createStaff(input) }, { status: 201 });
});
