import Link from "next/link";
import { adminListCustomers } from "@/lib/services/order.service";
import { SearchInput } from "@/components/admin/list-controls";
import { PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await adminListCustomers({ q: sp.q, page, pageSize: 20 });

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    return `/admin/customers?${next}`;
  };

  return (
    <>
      <PageHeader title="Customers" description={`${data.total} customer${data.total === 1 ? "" : "s"}`} />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput placeholder="Search name, email or phone" />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <th className={th}>Customer</th>
            <th className={th}>Phone</th>
            <th className={`${th} text-right`}>Orders</th>
            <th className={`${th} text-right`}>Total spent</th>
            <th className={th}>Last order</th>
            <th className={th}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.length === 0 && (
            <tr>
              <td colSpan={6} className={`${td} text-center text-gray-500 py-10`}>No customers found.</td>
            </tr>
          )}
          {data.customers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className={td}>
                <Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-wine">{c.name ?? "—"}</Link>
                <div className="text-xs text-gray-400">{c.email}</div>
              </td>
              <td className={td}>{c.phone ?? "—"}</td>
              <td className={`${td} text-right tabular-nums`}>{c.totalOrders}</td>
              <td className={`${td} text-right tabular-nums`}>{formatPrice(c.totalSpent)}</td>
              <td className={td}>{c.lastOrderDate ? formatDate(c.lastOrderDate) : "—"}</td>
              <td className={td}>{formatDate(c.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
    </>
  );
}
