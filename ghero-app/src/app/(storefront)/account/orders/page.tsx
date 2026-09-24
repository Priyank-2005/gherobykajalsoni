import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function OrdersPage() {
  const orders = [
    {
      id: "ORD-987654",
      date: "Oct 12, 2023",
      itemsCount: 2,
      total: 14500,
      status: "Delivered",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      id: "ORD-987655",
      date: "Nov 05, 2023",
      itemsCount: 1,
      total: 8900,
      status: "Processing",
      statusColor: "bg-blue-100 text-blue-800",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-charcoal mb-6">My Orders</h2>

      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center border border-gray-100">
          <p className="text-gray-500 font-body mb-4">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="inline-block bg-wine text-white px-6 py-2 font-body text-sm hover:bg-wine/90 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-heading text-lg text-charcoal">{order.id}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-body ${order.statusColor}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-sm font-body text-gray-500 flex flex-wrap gap-4">
                  <span>Date: {order.date}</span>
                  <span>Items: {order.itemsCount}</span>
                  <span>Total: {formatPrice(order.total)}</span>
                </div>
              </div>
              <div>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="inline-block border border-wine text-wine px-4 py-2 font-body text-sm hover:bg-wine hover:text-white transition-colors whitespace-nowrap"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
