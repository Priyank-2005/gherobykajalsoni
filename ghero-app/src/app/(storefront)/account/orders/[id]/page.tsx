import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CheckCircle2, Truck } from "lucide-react";
import { AppError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getUserOrder } from "@/lib/services/order.service";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatusType } from "@/types/order";
import { PayNowButton } from "./pay-now-button";

export const metadata: Metadata = { title: "Order details" };

const STEPS: OrderStatusType[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { user } = await requireAuth();
  const { id } = await params;
  const { placed } = await searchParams;
  const order = await getUserOrder(user.id, id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-wine transition-colors mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
      </Link>

      {placed && order.status !== "PENDING_PAYMENT" && (
        <div role="status" className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 flex gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>
            Thank you! Your order is confirmed. A confirmation has been sent to <b>{order.shipping.email}</b>.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl text-charcoal flex flex-wrap items-center gap-3">
            Order {order.orderNumber}
            <span className={`px-3 py-1 rounded-full text-xs font-body ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        {order.status === "PENDING_PAYMENT" && <PayNowButton orderId={order.id} total={order.total} />}
      </div>

      {stepIndex >= 0 && (
        <ol className="grid grid-cols-4 mb-10 text-xs sm:text-sm" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col items-center text-center relative">
              {i > 0 && <span className={`absolute top-3 right-1/2 w-full h-0.5 ${i <= stepIndex ? "bg-wine" : "bg-gray-200"}`} aria-hidden />}
              <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${i <= stepIndex ? "bg-wine text-white" : "bg-gray-200 text-gray-400"}`}>
                {i < stepIndex || s === "DELIVERED" && i === stepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </span>
              <span className={`mt-2 ${i <= stepIndex ? "text-charcoal" : "text-gray-400"}`}>{ORDER_STATUS_LABELS[s]}</span>
            </li>
          ))}
        </ol>
      )}

      {order.trackingUrl && (
        <a
          href={order.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center justify-between gap-4 p-4 bg-white border border-gold/20 hover:border-wine transition-colors"
        >
          <span className="flex items-center gap-3 text-charcoal">
            <Truck className="w-5 h-5 text-wine" /> Your package is on its way
          </span>
          <span className="text-sm text-wine underline">Track package</span>
        </a>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gold/10 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-100 pb-2">Items Ordered</h3>
            <ul className="space-y-6">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-28 bg-baby-pink flex-shrink-0">
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div>
                      <Link href={`/product/${item.productSlug}`} className="font-heading text-lg text-charcoal hover:text-wine">
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {[item.size && `Size: ${item.size}`, item.color && `Colour: ${item.color}`, `Qty: ${item.quantity}`].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">SKU {item.sku}</p>
                    </div>
                    <p className="text-charcoal font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                      {item.unitMrp > item.unitPrice && <span className="ml-2 text-sm text-gray-400 line-through font-normal">{formatPrice(item.unitMrp * item.quantity)}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-cream border border-gold/20 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gold/20 pb-2">Order Summary</h3>
            <dl className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-wine">
                  <dt>Coupon ({order.couponCode})</dt>
                  <dd>−{formatPrice(order.couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <dt>Shipping</dt>
                <dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
              </div>
            </dl>
            <div className="flex justify-between items-center border-t border-gold/20 pt-3">
              <span className="font-heading text-lg text-charcoal">Total</span>
              <span className="font-heading text-xl text-charcoal font-semibold">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="bg-white border border-gold/10 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-100 pb-2">Shipping To</h3>
            <address className="not-italic text-sm text-gray-600 space-y-1">
              <p className="font-medium text-charcoal">{order.shipping.name}</p>
              <p>
                {order.shipping.address1}
                {order.shipping.address2 && `, ${order.shipping.address2}`}
              </p>
              <p>{order.shipping.area}</p>
              <p>
                {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
              </p>
              <p className="pt-2">Phone: {order.shipping.phone}</p>
            </address>
          </div>

          <div className="bg-white border border-gold/10 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-100 pb-2">Payment</h3>
            <p className="text-sm text-gray-600">
              {order.payment ? PAYMENT_STATUS_LABELS[order.payment.status] : PAYMENT_STATUS_LABELS.PENDING}
              {order.payment?.razorpayPaymentId && <span className="block text-xs text-gray-400 mt-1 font-mono">Ref {order.payment.razorpayPaymentId}</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
