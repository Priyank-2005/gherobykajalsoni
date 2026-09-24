import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DUMMY_PRODUCTS } from "@/lib/dummy-data";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = {
    id,
    date: "Oct 12, 2023",
    status: "Delivered",
    statusColor: "bg-green-100 text-green-800",
    items: [
      {
        product: DUMMY_PRODUCTS[0],
        quantity: 1,
        variant: "M",
        price: 8500,
      },
      {
        product: DUMMY_PRODUCTS[1],
        quantity: 1,
        variant: "S",
        price: 6000,
      },
    ],
    subtotal: 14500,
    shipping: 0,
    total: 14500,
    shippingAddress: {
      name: "Priya Sharma",
      address: "123, Rosewood Apartments",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "9876543210",
    },
    paymentMethod: "Credit Card (ending in 4242)",
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm font-body text-gray-500 hover:text-wine transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl text-charcoal flex items-center gap-3">
            Order {order.id}
            <span
              className={`px-3 py-1 rounded-full text-xs font-body font-normal ${order.statusColor}`}
            >
              {order.status}
            </span>
          </h2>
          <p className="text-sm font-body text-gray-500 mt-1">Placed on {order.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-100 pb-2">
              Items Ordered
            </h3>
            <div className="space-y-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative w-20 h-28 bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading text-lg text-charcoal">
                        {item.product.name}
                      </h4>
                      <p className="text-sm font-body text-gray-500 mt-1">
                        Size: {item.variant} | Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-body text-charcoal font-medium">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          <div className="bg-cream border border-gray-200 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-200 pb-2">
              Order Summary
            </h3>
            <div className="space-y-3 font-body text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="font-heading text-lg text-charcoal">Total</span>
              <span className="font-heading text-xl text-charcoal font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-100 pb-2">
              Shipping Information
            </h3>
            <div className="font-body text-sm text-gray-600 space-y-1">
              <p className="font-medium text-charcoal">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
              <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6">
            <h3 className="font-heading text-xl text-charcoal mb-4 border-b border-gray-100 pb-2">
              Payment Method
            </h3>
            <p className="font-body text-sm text-gray-600">
              {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
