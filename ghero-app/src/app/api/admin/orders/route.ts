import type { OrderStatus } from "@prisma/client";
import { ok } from "@/lib/api";
import { adminRoute, intParam } from "@/lib/admin-api";
import { adminListOrders } from "@/lib/services/order.service";

const STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const SORTS = ["newest", "oldest", "total_desc", "total_asc"] as const;

/** Query: status, q (order no. / name / email / phone), sort, page, pageSize */
export const GET = adminRoute(async (request: Request) => {
  const p = new URL(request.url).searchParams;
  const status = p.get("status") as OrderStatus | null;
  const sort = p.get("sort") as (typeof SORTS)[number] | null;
  return ok(
    await adminListOrders({
      status: status && STATUSES.includes(status) ? status : undefined,
      q: p.get("q") || undefined,
      sort: sort && SORTS.includes(sort) ? sort : undefined,
      page: intParam(p.get("page"), 1),
      pageSize: intParam(p.get("pageSize"), 20, 100),
    })
  );
});
