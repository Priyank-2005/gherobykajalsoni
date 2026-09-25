import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { listUserOrders } from "@/lib/services/order.service";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types/order";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const { user } = await requireAuth();
  const orders = await listUserOrders(user.id);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-charcoal">My Orders</h2>

      {orders.length === 0 ? (
        <div className="bg-white border border-gold/10">
          <EmptyState
            icon={<Package className="w-12 h-12" strokeWidth={1.25} />}
            title="No orders yet"
            description="When you place an order, it will show up here with its status and tracking."
            action={
              <Link href="/shop" className="inline-block bg-wine text-white px-6 py-2 text-sm hover:bg-wine/90 transition-colors">
                Start Shopping
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="bg-white p-5 border border-gold/10 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative w-16 h-20 bg-baby-pink shrink-0 hidden sm:block">
                {order.imageUrl && <Image src={order.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-heading text-lg text-charcoal">{order.orderNumber}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                  {order.status === "PENDING_PAYMENT" && (
                    <span className="text-xs text-gray-500">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-1 mb-1">{order.itemsSummary}</p>
                <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{formatDate(order.createdAt)}</span>
                  <span>
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </span>
                  <span className="text-charcoal font-medium">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <Link href={`/account/orders/${order.id}`} className="inline-block border border-wine text-wine px-4 py-2 text-sm hover:bg-wine hover:text-white transition-colors whitespace-nowrap text-center">
                  {order.status === "PENDING_PAYMENT" ? "View & Pay" : "View Details"}
                </Link>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 text-sm text-gray-600 underline hover:text-wine whitespace-nowrap text-center">
                    Track package
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
