import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/api";
import { adminGetCustomer } from "@/lib/services/order.service";
import { Card, OrderStatusBadge, PageHeader, Pill, Stat, TableWrap, td, th } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Customer" };

const COUNTED = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await adminGetCustomer(id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const paid = customer.orders.filter((o) => COUNTED.includes(o.status));
  const spent = paid.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHeader back={{ href: "/admin/customers", label: "Customers" }} title={customer.name ?? customer.email} description={`Customer since ${formatDate(customer.createdAt)}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Paid orders" value={paid.length} />
        <Stat label="Total spent" value={formatPrice(spent)} />
        <Stat label="Average order" value={paid.length ? formatPrice(spent / paid.length) : "—"} />
        <Stat label="All orders" value={customer.orders.length} hint="incl. unpaid / cancelled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-medium mb-3">Order history</h2>
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Items</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.length === 0 && (
                <tr>
                  <td colSpan={4} className={`${td} text-gray-500`}>No orders yet.</td>
                </tr>
              )}
              {customer.orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className={td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-wine">{o.orderNumber}</Link>
                    <div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div>
                  </td>
                  <td className={`${td} max-w-[16rem]`}>
                    <span className="line-clamp-1">{o.itemsSummary}</span>
                  </td>
                  <td className={td}><OrderStatusBadge status={o.status} /></td>
                  <td className={`${td} text-right tabular-nums`}>{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>

        <div className="space-y-6">
          <Card title="Profile">
            <dl className="text-sm space-y-2">
              <div><dt className="text-gray-500 text-xs">Name</dt><dd>{customer.name ?? "—"}</dd></div>
              <div><dt className="text-gray-500 text-xs">Email</dt><dd className="break-all"><a href={`mailto:${customer.email}`} className="hover:text-wine">{customer.email}</a></dd></div>
              <div><dt className="text-gray-500 text-xs">Phone</dt><dd>{customer.phone ? <a href={`tel:+91${customer.phone}`} className="hover:text-wine">{customer.phone}</a> : "—"}</dd></div>
            </dl>
          </Card>
          <Card title={`Addresses (${customer.addresses.length})`}>
            {customer.addresses.length === 0 && <p className="text-sm text-gray-500">No saved addresses.</p>}
            <ul className="space-y-4 text-sm">
              {customer.addresses.map((a) => (
                <li key={a.id}>
                  <p className="font-medium flex items-center gap-2">{a.fullName} {a.isDefault && <Pill>Default</Pill>}</p>
                  <p className="text-gray-600">
                    {a.addressLine1}
                    {a.addressLine2 && `, ${a.addressLine2}`}, {a.area}, {a.city}, {a.state} {a.pincode}
                  </p>
                  <p className="text-gray-500">{a.phone}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
