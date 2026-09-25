import { ok } from "@/lib/api";
import { adminRoute, intParam } from "@/lib/admin-api";
import { adminListCustomers } from "@/lib/services/order.service";

/** Query: q (name / email / phone), page, pageSize */
export const GET = adminRoute(async (request: Request) => {
  const p = new URL(request.url).searchParams;
  return ok(
    await adminListCustomers({
      q: p.get("q") || undefined,
      page: intParam(p.get("page"), 1),
      pageSize: intParam(p.get("pageSize"), 20, 100),
    })
  );
});
