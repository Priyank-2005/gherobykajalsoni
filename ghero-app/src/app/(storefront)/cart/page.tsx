"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, Tag, AlertCircle } from "lucide-react";
import { useStore } from "@/components/storefront/store-provider";
import { useToast } from "@/components/ui/toast";
import { Breadcrumb, EmptyState, Spinner } from "@/components/ui/feedback";
import { SkeletonBox } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";
import { cn, formatPrice } from "@/lib/utils";
import type { CartLineIssue } from "@/types/cart";

const ISSUE_TEXT: Record<CartLineIssue, string> = {
  UNAVAILABLE: "No longer available. Please remove it.",
  OUT_OF_STOCK: "Out of stock. Please remove it.",
  INSUFFICIENT_STOCK: "Only a few left. Reduce the quantity.",
};

export default function CartPage() {
  const { cart, updateCartItem, removeCartItem, applyCoupon, removeCoupon } = useStore();
  const toast = useToast();
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const mutate = async (itemId: string, fn: () => Promise<unknown>) => {
    setBusyItem(itemId);
    try {
      await fn();
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusyItem(null);
    }
  };

  const submitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      await applyCoupon(code.trim());
      setCode("");
      toast("Coupon applied");
    } catch (error) {
      setCouponError(errorMessage(error));
    } finally {
      setCouponBusy(false);
    }
  };

  if (!cart) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl" aria-busy="true">
        <SkeletonBox className="h-10 w-64 mb-8" />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
            {[0, 1].map((i) => (
              <SkeletonBox key={i} className="h-32 w-full" />
            ))}
          </div>
          <SkeletonBox className="w-full lg:w-96 h-80" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <EmptyState
          icon={<ShoppingBag size={64} strokeWidth={1} />}
          title="Your bag is empty"
          description="Looks like you haven't added anything to your bag yet."
          action={
            <Link href="/shop" className="inline-block bg-wine text-white px-8 py-3 text-sm tracking-wider uppercase hover:bg-wine/90 transition-colors">
              Continue Shopping
            </Link>
          }
        />
      </div>
    );
  }

  const s = cart.summary;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shopping Bag" }]} />
      <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-8">Shopping Bag</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-grow min-w-0">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gold/20 text-sm text-gray-500 uppercase tracking-wider">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>

          <ul>
            {cart.items.map((item) => {
              const busy = busyItem === item.id;
              const variantText = [item.variant.size && `Size: ${item.variant.size}`, item.variant.color && `Colour: ${item.variant.color}`]
                .filter(Boolean)
                .join(" · ");
              const maxQty = Math.min(item.variant.stock, 10);
              return (
                <li
                  key={item.id}
                  className={cn("grid grid-cols-[auto_1fr] md:grid-cols-12 gap-4 py-6 border-b border-gold/20 items-center", busy && "opacity-60")}
                >
                  <div className="md:col-span-6 flex gap-4 col-span-2">
                    <Link href={`/product/${item.product.slug}`} className="relative w-24 h-32 md:w-20 md:h-28 flex-shrink-0 bg-baby-pink">
                      {item.product.imageUrl && <Image src={item.product.imageUrl} alt={item.product.name} fill sizes="96px" className="object-cover" />}
                    </Link>
                    <div className="flex flex-col justify-center min-w-0">
                      <Link href={`/product/${item.product.slug}`} className="font-heading text-lg text-charcoal hover:text-wine line-clamp-2">
                        {item.product.name}
                      </Link>
                      {variantText && <p className="text-sm text-gray-500 mt-1">{variantText}</p>}
                      {item.issue && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 shrink-0" /> {ISSUE_TEXT[item.issue]}
                        </p>
                      )}
                      <p className="md:hidden text-charcoal mt-2">{formatPrice(item.variant.price)}</p>
                      <div className="md:hidden flex items-center gap-4 mt-3">
                        <QuantityControl
                          quantity={item.quantity}
                          max={maxQty}
                          disabled={busy || item.issue === "UNAVAILABLE" || item.issue === "OUT_OF_STOCK"}
                          onChange={(q) => mutate(item.id, () => updateCartItem(item.id, q))}
                        />
                        <button onClick={() => mutate(item.id, () => removeCartItem(item.id))} className="text-sm text-gray-500 hover:text-wine flex items-center gap-1">
                          <X className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-2 text-center text-charcoal">
                    {formatPrice(item.variant.price)}
                    {item.variant.mrp > item.variant.price && (
                      <span className="block text-xs text-gray-400 line-through">{formatPrice(item.variant.mrp)}</span>
                    )}
                  </div>

                  <div className="hidden md:flex col-span-2 justify-center">
                    <QuantityControl
                      quantity={item.quantity}
                      max={maxQty}
                      disabled={busy || item.issue === "UNAVAILABLE" || item.issue === "OUT_OF_STOCK"}
                      onChange={(q) => mutate(item.id, () => updateCartItem(item.id, q))}
                    />
                  </div>

                  <div className="hidden md:flex col-span-2 justify-end items-center gap-4">
                    <span className="text-charcoal font-medium">{formatPrice(item.lineTotal)}</span>
                    <button
                      onClick={() => mutate(item.id, () => removeCartItem(item.id))}
                      className="text-gray-400 hover:text-wine transition-colors"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      {busy ? <Spinner className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-cream p-6 border border-gold/20 lg:sticky lg:top-28">
            <h2 className="font-heading text-2xl text-charcoal mb-6">Order Summary</h2>

            <dl className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal ({s.itemCount} {s.itemCount === 1 ? "item" : "items"})</dt>
                <dd className="text-charcoal font-medium">{formatPrice(s.subtotal)}</dd>
              </div>
              {s.savings > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>You save on MRP</dt>
                  <dd>{formatPrice(s.savings)}</dd>
                </div>
              )}
              {s.couponCode && !s.couponError && (
                <div className="flex justify-between text-wine">
                  <dt>Coupon ({s.couponCode})</dt>
                  <dd>−{formatPrice(s.couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <dt>Shipping</dt>
                <dd className="text-charcoal">{s.shippingFee > 0 ? formatPrice(s.shippingFee) : "Free"}</dd>
              </div>
            </dl>

            <div className="mb-6">
              {s.couponCode ? (
                <div className={cn("flex items-center justify-between gap-3 border px-3 py-2 text-sm bg-white", s.couponError ? "border-red-300" : "border-green-300")}>
                  <span className="flex items-center gap-2">
                    <Tag className={cn("w-4 h-4", s.couponError ? "text-red-500" : "text-green-600")} />
                    <span>
                      <b>{s.couponCode}</b>
                      {s.couponError ? <span className="block text-xs text-red-600">{s.couponError}</span> : <span className="text-green-700"> applied</span>}
                    </span>
                  </span>
                  <button
                    onClick={async () => {
                      setCouponBusy(true);
                      try {
                        await removeCoupon();
                      } catch (error) {
                        toast(errorMessage(error), "error");
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                    disabled={couponBusy}
                    className="text-xs underline text-gray-500 hover:text-wine"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={submitCoupon}>
                  <label htmlFor="coupon" className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Discount code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="coupon"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      className="flex-grow min-w-0 border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:border-wine bg-white"
                      placeholder="Enter code"
                      aria-invalid={Boolean(couponError)}
                      aria-describedby={couponError ? "coupon-error" : undefined}
                    />
                    <button
                      disabled={couponBusy || !code.trim()}
                      className="bg-charcoal text-white px-4 py-2 text-sm uppercase tracking-wider hover:bg-wine transition-colors disabled:opacity-50"
                    >
                      {couponBusy ? "…" : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p id="coupon-error" className="text-xs text-red-600 mt-2">
                      {couponError}
                    </p>
                  )}
                </form>
              )}
            </div>

            <div className="border-t border-gold/30 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-heading text-xl text-charcoal">Total</span>
                <span className="font-heading text-2xl text-charcoal font-semibold">{formatPrice(s.total)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">Inclusive of all taxes</p>
            </div>

            {cart.hasIssues ? (
              <p className="text-sm text-red-600 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> Please update the highlighted items before checking out.
              </p>
            ) : null}
            <Link
              href="/checkout"
              aria-disabled={cart.hasIssues}
              onClick={(e) => cart.hasIssues && e.preventDefault()}
              className={cn(
                "block w-full bg-wine text-white text-center py-4 text-sm uppercase tracking-wider hover:bg-wine/90 transition-colors mb-4",
                cart.hasIssues && "opacity-50 cursor-not-allowed"
              )}
            >
              Proceed to Checkout
            </Link>
            <Link href="/shop" className="block w-full text-center text-charcoal text-sm underline hover:text-wine transition-colors">
              Continue Shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuantityControl({ quantity, max, disabled, onChange }: { quantity: number; max: number; disabled?: boolean; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center border border-gray-300 bg-white">
      <button
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity <= 1}
        className="p-2 text-gray-500 hover:text-wine disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center text-charcoal" aria-live="polite">
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || quantity >= max}
        className="p-2 text-gray-500 hover:text-wine disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
