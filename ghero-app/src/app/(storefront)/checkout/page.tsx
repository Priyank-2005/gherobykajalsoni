"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DUMMY_PRODUCTS } from "@/lib/dummy-data";

export default function CheckoutPage() {
  const cartItems = [
    {
      product: DUMMY_PRODUCTS[0],
      quantity: 1,
      variant: "M",
    },
    {
      product: DUMMY_PRODUCTS[1],
      quantity: 2,
      variant: "S",
    },
  ];

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.basePrice * item.quantity,
    0
  );
  const discount = 0;
  const total = subtotal - discount;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/cart" className="hover:text-wine transition-colors">
          Cart
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">Checkout</span>
      </nav>

      <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-8">
        Checkout
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left: Form */}
        <div className="flex-grow">
          <form className="space-y-10">
            {/* Contact Info */}
            <section>
              <h2 className="font-heading text-2xl text-charcoal mb-6 border-b border-gray-200 pb-2">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-body text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-body text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Info */}
            <section>
              <h2 className="font-heading text-2xl text-charcoal mb-6 border-b border-gray-200 pb-2">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-body text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-body text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-body text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                    placeholder="House/Flat No., Building Name"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-body text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                    placeholder="Street, Area, Landmark"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-body text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-body text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-body text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 px-4 py-2 font-body focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-body text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    disabled
                    value="India"
                    className="w-full border border-gray-300 px-4 py-2 font-body bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-cream p-6 border border-gray-200 sticky top-24">
            <h2 className="font-heading text-xl text-charcoal mb-6 border-b border-gray-200 pb-2">
              In Your Bag
            </h2>
            
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
              {cartItems.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative w-16 h-20 bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute -top-2 -right-2 bg-wine text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-body">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <h3 className="font-heading text-sm text-charcoal line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-body">Size: {item.variant}</p>
                    <p className="font-body text-charcoal text-sm mt-1">
                      {formatPrice(item.product.basePrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 font-body text-sm mb-6 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="text-charcoal">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-charcoal">Free</span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-heading text-xl text-charcoal">Total</span>
                <span className="font-heading text-2xl text-charcoal font-semibold">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-body mt-1 text-right">
                Including taxes
              </p>
            </div>

            <button className="w-full bg-[#C5A55A] text-white text-center py-4 font-body font-medium tracking-wide hover:bg-[#b0924e] transition-colors">
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
