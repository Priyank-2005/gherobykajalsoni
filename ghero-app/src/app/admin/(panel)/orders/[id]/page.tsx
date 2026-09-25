import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Printer } from "lucide-react";
import { AppError } from "@/lib/api";
import { adminGetOrder } from "@/lib/services/order.service";
import { Card, OrderStatusBadge, PageHeader, PaymentBadge } from "@/components/admin/ui";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { OrderStatusForm } from "./status-form";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await adminGetOrder(id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <Link
            href={`/admin/invoice/${order.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 border border-gray-300 bg-white rounded-md px-3 py-2 text-sm hover:border-wine"
          >
            <Printer className="w-4 h-4" /> Invoice
          </Link>
        }
      />

      {order.notes && (
        <div role="alert" className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Needs attention</p>
            <p className="mt-1 whitespace-pre-wrap">{order.notes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Items (${order.items.reduce((s, i) => s + i.quantity, 0)})`}>
            <ul className="divide-y divide-gray-100 -my-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3">
                  <div className="relative w-14 h-18 bg-gray-100 shrink-0 rounded overflow-hidden">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-gray-500">
                      {[item.size, item.color].filter(Boolean).join(" / ")} · SKU {item.sku}
                    </p>
                    <p className="text-gray-500">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
              {order.couponCode && (
                <div className="flex justify-between"><dt className="text-gray-500">Coupon {order.couponCode}</dt><dd className="tabular-nums">−{formatPrice(order.couponDiscount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-gray-500">Shipping</dt><dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd></div>
              <div className="flex justify-between font-semibold pt-1.5 border-t border-gray-100"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
            </dl>
          </Card>

          <Card title="Update status">
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              allowed={order.allowedTransitions}
              trackingUrl={order.trackingUrl}
              notes={order.notes}
              stockCommitted={order.stockCommitted}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <OrderStatusBadge status={order.status} />
              <PaymentBadge status={order.payment?.status ?? "PENDING"} />
            </div>
            {order.payment?.razorpayPaymentId && <p className="text-xs text-gray-500 mt-3 font-mono break-all">Razorpay {order.payment.razorpayPaymentId}</p>}
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-wine hover:underline mt-3 break-all">
                Tracking link
              </a>
            )}
          </Card>

          <Card title="Customer">
            <div className="text-sm space-y-1">
              {order.customer ? (
                <Link href={`/admin/customers/${order.customer.id}`} className="font-medium hover:text-wine">
                  {order.customer.name ?? order.customer.email}
                </Link>
              ) : null}
              <p className="text-gray-600 break-all">{order.shipping.email}</p>
              <p className="text-gray-600">{order.shipping.phone}</p>
            </div>
          </Card>

          <Card title="Ship to">
            <address className="not-italic text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-charcoal">{order.shipping.name}</p>
              <p>{order.shipping.address1}</p>
              {order.shipping.address2 && <p>{order.shipping.address2}</p>}
              <p>{order.shipping.area}</p>
              <p>
                {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
              </p>
              <p>{order.shipping.country}</p>
              <p className="pt-1">{order.shipping.phone}</p>
            </address>
          </Card>
        </div>
      </div>
    </>
  );
}
