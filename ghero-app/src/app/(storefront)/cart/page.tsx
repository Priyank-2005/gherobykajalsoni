"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Minus, Plus, X, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DUMMY_PRODUCTS } from "@/lib/dummy-data";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([
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
  ]);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newItems = [...cartItems];
    newItems[index].quantity = newQuantity;
    setCartItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.basePrice * item.quantity,
    0
  );
  const discount = 0; // Replace with actual discount logic
  const total = subtotal - discount;

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <div className="flex justify-center mb-6 text-wine">
          <ShoppingBag size={64} strokeWidth={1} />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-4">
          Your bag is empty
        </h1>
        <p className="text-gray-600 font-body mb-8">
          Looks like you haven&apos;t added anything to your bag yet.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-wine text-white px-8 py-3 rounded-none font-body text-sm tracking-wider uppercase hover:bg-wine/90 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/" className="hover:text-wine transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">Shopping Bag</span>
      </nav>

      <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-8">
        Shopping Bag
      </h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-grow">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-body text-gray-500 uppercase tracking-wider">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>

          <div className="space-y-6 md:space-y-0 mt-6 md:mt-0">
            {cartItems.map((item, index) => (
              <div
                key={`${item.product.id}-${item.variant}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-gray-200 items-center"
              >
                {/* Mobile View: Product Info */}
                <div className="col-span-1 md:col-span-6 flex gap-4">
                  <div className="relative w-24 h-32 md:w-20 md:h-28 flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-heading text-lg text-charcoal">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-body mt-1">
                      Size: {item.variant}
                    </p>
                    {/* Mobile Price */}
                    <p className="md:hidden text-charcoal font-body mt-2">
                      {formatPrice(item.product.basePrice)}
                    </p>
                    <button
                      onClick={() => removeItem(index)}
                      className="md:hidden text-sm text-gray-400 hover:text-wine flex items-center gap-1 mt-3 w-fit transition-colors"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>

                {/* Desktop Price */}
                <div className="hidden md:block col-span-2 text-center font-body text-charcoal">
                  {formatPrice(item.product.basePrice)}
                </div>

                {/* Quantity */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-center">
                  <div className="flex items-center border border-gray-300 rounded-sm">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-2 text-gray-500 hover:text-wine hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-body text-charcoal">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-2 text-gray-500 hover:text-wine hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal & Desktop Remove */}
                <div className="hidden md:flex col-span-2 justify-end items-center gap-4">
                  <span className="font-body text-charcoal font-medium">
                    {formatPrice(item.product.basePrice * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-wine transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-cream p-6 border border-gray-200">
            <h2 className="font-heading text-2xl text-charcoal mb-6">
              Order Summary
            </h2>
            
            <div className="space-y-4 font-body text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="text-charcoal font-medium">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-wine">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-charcoal">Calculated at checkout</span>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="coupon" className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-body">
                Gift Card or Discount Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="coupon"
                  className="flex-grow border border-gray-300 px-3 py-2 font-body text-sm focus:outline-none focus:border-wine bg-white"
                  placeholder="Enter code"
                />
                <button className="bg-gray-900 text-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-wine transition-colors">
                  Apply
                </button>
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

            <Link
              href="/checkout"
              className="block w-full bg-wine text-white text-center py-4 font-body text-sm uppercase tracking-wider hover:bg-wine/90 transition-colors mb-4"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/shop"
              className="block w-full text-center text-charcoal font-body text-sm underline hover:text-wine transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
