import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { adminDashboard } from "@/lib/services/order.service";
import { lowStockVariants } from "@/lib/services/inventory.service";
import { dashboardPosCards } from "@/lib/services/reports.service";
import { getOpenRegister, registerSummary } from "@/lib/services/register.service";
import { Card, OrderStatusBadge, PageHeader, Pill, Stat, TableWrap, td, th } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [{ metrics: m, recentOrders, recentCustomers }, lowStock, pos, register] = await Promise.all([
    adminDashboard(),
    lowStockVariants(),
    dashboardPosCards(),
    getOpenRegister(),
  ]);
  const drawer = register ? await registerSummary(register.id) : null;

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your store" />

      {pos.refundNeeded.length > 0 && (
        <Card title="Online payments that need a refund or a check" className="mb-4 border-red-300">
          <p className="text-sm text-gray-600 mb-3">
            Paid after the last piece was sold (often in the shop at the same moment), paid after the order was cancelled, or paid a different amount. Open each order to see what happened, then refund in Razorpay or restock and ship.
          </p>
          <ul className="divide-y divide-gray-100 text-sm">
            {pos.refundNeeded.map((o) => (
              <li key={o.id} className="flex justify-between gap-3 py-2">
                <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-wine">{o.orderNumber}</Link>
                <span className="text-gray-600 truncate">{o.shippingName}</span>
                <span className="tabular-nums">{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Stat label="Shop sales today" value={formatPrice(pos.today.shop.sales)} hint={`${pos.today.shop.bills} bill${pos.today.shop.bills === 1 ? "" : "s"}`} href="/admin/orders?channel=POS" />
        <Stat label="Website sales today" value={formatPrice(pos.today.online.sales)} hint={`${pos.today.online.orders} order${pos.today.online.orders === 1 ? "" : "s"}`} href="/admin/orders?channel=ONLINE" />
        <Stat label="Cash in drawer" value={drawer ? formatPrice(drawer.expectedCash) : "Closed"} hint={drawer ? `Day open · ${drawer.billCount} bills` : "Open the day in the POS"} />
        <Stat label="Reports" value="View" hint="Shop + website, by day, category, staff" href="/admin/reports" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Stat label="Revenue" value={formatPrice(m.totalRevenue)} hint="Paid orders, excl. cancelled" />
        <Stat label="Online orders" value={m.totalOrders} href="/admin/orders?channel=ONLINE" />
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
                  <td className={td}>
                    {o.channel === "POS" ? (o.status === "CANCELLED" ? <OrderStatusBadge status={o.status} /> : <Pill tone="gold">Shop bill</Pill>) : <OrderStatusBadge status={o.status} />}
                  </td>
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
                  <span className="block text-xs text-gray-400 truncate">{c.email ?? c.phone}</span>
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
