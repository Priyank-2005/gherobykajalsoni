import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { adminDashboard } from "@/lib/services/order.service";
import { lowStockVariants } from "@/lib/services/inventory.service";
import { Card, OrderStatusBadge, PageHeader, Stat, TableWrap, td, th } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [{ metrics: m, recentOrders, recentCustomers }, lowStock] = await Promise.all([adminDashboard(), lowStockVariants()]);

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your store" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Stat label="Revenue" value={formatPrice(m.totalRevenue)} hint="Paid orders, excl. cancelled" />
        <Stat label="Orders" value={m.totalOrders} href="/admin/orders" />
        <Stat label="Customers" value={m.totalCustomers} href="/admin/customers" />
        <Stat label="Products" value={m.totalProducts} hint={`${m.publishedProducts} published`} href="/admin/products" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <Stat label="Pending payment" value={m.pendingOrders} href="/admin/orders?status=PENDING_PAYMENT" />
        <Stat label="Paid (to pack)" value={m.paidOrders} tone={m.paidOrders > 0 ? "warn" : "default"} href="/admin/orders?status=PAID" />
        <Stat label="Processing" value={m.processingOrders} href="/admin/orders?status=PROCESSING" />
        <Stat label="Shipped" value={m.shippedOrders} href="/admin/orders?status=SHIPPED" />
        <Stat label="Delivered" value={m.deliveredOrders} href="/admin/orders?status=DELIVERED" />
        <Stat label="Cancelled" value={m.cancelledOrders} href="/admin/orders?status=CANCELLED" />
      </div>

      {lowStock.length > 0 && (
        <Card
          title="Low stock"
          className="mb-8 border-amber-300"
          actions={<span className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="w-4 h-4" /> {m.lowStockProducts} variant(s) at 3 or fewer</span>}
        >
          <ul className="divide-y divide-gray-100 -my-2">
            {lowStock.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/admin/products/${v.product.id}`} className="hover:text-wine min-w-0 truncate">
                  {v.product.name} <span className="text-gray-400">· {[v.size, v.color].filter(Boolean).join(" / ") || v.sku}</span>
                </Link>
                <span className={v.stock === 0 ? "text-red-600 font-medium" : "text-amber-700"}>{v.stock === 0 ? "Out of stock" : `${v.stock} left`}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-wine hover:underline">View all</Link>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td className={`${td} text-gray-500`} colSpan={4}>No orders yet.</td>
                </tr>
              )}
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className={td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-wine">{o.orderNumber}</Link>
                    <div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div>
                  </td>
                  <td className={td}>
                    {o.customerName}
                    <div className="text-xs text-gray-400">{o.customerEmail}</div>
                  </td>
                  <td className={td}><OrderStatusBadge status={o.status} /></td>
                  <td className={`${td} text-right tabular-nums`}>{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>

        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">New customers</h2>
            <Link href="/admin/customers" className="text-sm text-wine hover:underline">View all</Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {recentCustomers.length === 0 && <p className="p-4 text-sm text-gray-500">No customers yet.</p>}
            {recentCustomers.map((c) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{c.name ?? "—"}</span>
                  <span className="block text-xs text-gray-400 truncate">{c.email}</span>
                </span>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(c.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
