import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { adminListOrders } from "@/lib/services/order.service";
import { prisma } from "@/lib/db";
import { FilterTabs, SearchInput, SelectFilter } from "@/components/admin/list-controls";
import { OrderStatusBadge, PageHeader, PaymentBadge, Pill, TableWrap, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types/order";

export const metadata = { title: "Orders" };

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const SORTS = ["newest", "oldest", "total_desc", "total_asc"] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const sort = SORTS.includes(sp.sort as (typeof SORTS)[number]) ? (sp.sort as (typeof SORTS)[number]) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const [data, counts] = await Promise.all([
    adminListOrders({ status, q: sp.q, sort, page, pageSize: 20 }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: OrderStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    return `/admin/orders?${next}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${data.total} order${data.total === 1 ? "" : "s"}`} />

      <FilterTabs
        param="status"
        tabs={[
          { value: "", label: "All", count: counts.reduce((s, c) => s + c._count, 0) },
          ...STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s], count: count(s) })),
        ]}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput placeholder="Search order no., name, email, phone" />
        <SelectFilter
          param="sort"
          label="Sort orders"
          options={[
            { value: "", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "total_desc", label: "Highest total" },
            { value: "total_asc", label: "Lowest total" },
          ]}
        />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th className={th}>Order</th>
            <th className={th}>Customer</th>
            <th className={th}>Items</th>
            <th className={th}>Payment</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.orders.length === 0 && (
            <tr>
              <td colSpan={6} className={`${td} text-center text-gray-500 py-10`}>
                No orders match these filters.
              </td>
            </tr>
          )}
          {data.orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className={td}>
                <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-wine">
                  {o.orderNumber}
                </Link>
                <div className="text-xs text-gray-400">{formatDateTime(o.createdAt)}</div>
              </td>
              <td className={td}>
                {o.customerName}
                <div className="text-xs text-gray-400">{o.customerPhone}</div>
              </td>
              <td className={`${td} tabular-nums`}>{o.itemCount}</td>
              <td className={td}><PaymentBadge status={o.paymentStatus} /></td>
              <td className={td}>
                <div className="flex flex-wrap items-center gap-1">
                  <OrderStatusBadge status={o.status} />
                  {o.needsReview && <Pill tone="red">Needs review</Pill>}
                </div>
              </td>
              <td className={`${td} text-right tabular-nums font-medium`}>{formatPrice(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
    </>
  );
}
