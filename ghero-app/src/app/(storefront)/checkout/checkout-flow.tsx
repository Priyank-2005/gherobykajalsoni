"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, ShoppingBag, AlertCircle } from "lucide-react";
import { useStore } from "@/components/storefront/store-provider";
import { OtpSignIn } from "@/components/storefront/otp-sign-in";
import { AddressForm, emptyAddress, validateAddress, type AddressFields } from "@/components/storefront/address-form";
import { Breadcrumb, EmptyState } from "@/components/ui/feedback";
import { SkeletonBox } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, errorMessage, fieldErrors } from "@/lib/api-client";
import { payForOrder } from "@/lib/pay-for-order";
import { cn, formatPrice } from "@/lib/utils";

type SavedAddress = AddressFields & { id: string; isDefault: boolean };

/**
 * Checkout: 1) contact + email OTP gate (guests), 2) shipping address, 3) place order + pay.
 * Every total shown comes from the server; the order is created from the server-side cart.
 */
export function CheckoutFlow({ savedAddresses }: { savedAddresses: SavedAddress[] }) {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser, cart, refreshCart } = useStore();

  // One key per visit to this page: retries of "Place order" can't create duplicate orders.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [addresses, setAddresses] = useState(savedAddresses);
  const [selectedId, setSelectedId] = useState<string | "new">(savedAddresses.find((a) => a.isDefault)?.id ?? savedAddresses[0]?.id ?? "new");
  const [address, setAddress] = useState<AddressFields>({ ...emptyAddress, fullName: user?.name ?? "", phone: user?.phone ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [contact, setContact] = useState({ email: "", name: "", phone: "" });
  const [contactReady, setContactReady] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string; orderId?: string } | null>(null);

  if (!cart) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl" aria-busy="true">
        <SkeletonBox className="h-10 w-48 mb-8" />
        <div className="flex flex-col lg:flex-row gap-12">
          <SkeletonBox className="flex-1 h-96" />
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
          description="Add something you love, then come back to check out."
          action={
            <Link href="/shop" className="bg-wine text-white px-8 py-3 text-sm uppercase tracking-wider hover:bg-wine/90">
              Continue Shopping
            </Link>
          }
        />
      </div>
    );
  }

  const s = cart.summary;
  const usingNew = selectedId === "new" || addresses.length === 0;

  const placeOrder = async () => {
    setNotice(null);
    let payload: Record<string, unknown>;
    if (usingNew) {
      const { data, errors: errs } = validateAddress(address);
      setErrors(errs);
      if (!data) {
        document.getElementById(`ship-${Object.keys(errs)[0]}`)?.focus();
        return;
      }
      payload = { idempotencyKey, address: data, saveAddress };
    } else {
      payload = { idempotencyKey, addressId: selectedId };
    }

    setPlacing(true);
    let orderId: string | undefined;
    try {
      const { order } = await api<{ order: { id: string; orderNumber: string } }>("/api/checkout", { body: payload });
      orderId = order.id;
      const result = await payForOrder(order.id);
      if (result === "cancelled") {
        setNotice({ kind: "info", text: `Payment was cancelled. Your order ${order.orderNumber} is saved; you can pay for it any time.`, orderId });
        return;
      }
      await refreshCart();
      router.push(`/account/orders/${order.id}?placed=1`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PAYMENTS_DISABLED" && orderId) {
        setNotice({ kind: "info", text: "Your order is saved. Online payment isn't switched on yet; you'll be able to pay from your order page as soon as it is.", orderId });
      } else if (error instanceof ApiError && error.status === 400 && error.issues) {
        setErrors(fieldErrors(error, "address."));
        setNotice({ kind: "error", text: error.message });
      } else {
        setNotice({ kind: "error", text: errorMessage(error), orderId });
        if (error instanceof ApiError && error.code === "CART_ISSUES") refreshCart();
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <Breadcrumb items={[{ label: "Bag", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        <div className="flex-grow min-w-0 space-y-10">
          {/* 1. Contact / auth gate */}
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-heading text-2xl text-charcoal mb-6 border-b border-gold/20 pb-2 flex items-center gap-3">
              <StepBadge n={1} done={Boolean(user)} /> Contact
            </h2>
            {user ? (
              <div className="flex items-center justify-between gap-4 bg-white border border-gold/15 px-4 py-3">
                <div>
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-charcoal break-all">{user.email}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              </div>
            ) : !contactReady ? (
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactReady(true);
                }}
              >
                <div className="md:col-span-2">
                  <label htmlFor="c-email" className="block text-sm text-gray-700 mb-1">
                    Email <span className="text-wine">*</span>
                  </label>
                  <input id="c-email" type="email" required autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine" />
                  <p className="text-xs text-gray-500 mt-1">We&apos;ll email you a one-time code to confirm it&apos;s you. Order updates are sent here.</p>
                </div>
                <div>
                  <label htmlFor="c-name" className="block text-sm text-gray-700 mb-1">
                    Full name <span className="text-wine">*</span>
                  </label>
                  <input id="c-name" required autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine" />
                </div>
                <div>
                  <label htmlFor="c-phone" className="block text-sm text-gray-700 mb-1">
                    Mobile number <span className="text-wine">*</span>
                  </label>
                  <input id="c-phone" type="tel" required inputMode="numeric" autoComplete="tel-national" pattern="(\+?91)?[\s-]?[6-9][0-9]{4}[\s-]?[0-9]{5}" title="10-digit Indian mobile number" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine" />
                </div>
                <div className="md:col-span-2">
                  <button className="w-full md:w-auto px-8 py-3 bg-wine text-white text-sm uppercase tracking-wider hover:bg-wine/90">Continue</button>
                </div>
              </form>
            ) : (
              <div className="bg-white border border-gold/15 p-6">
                <OtpSignIn
                  initialEmail={contact.email}
                  emailLocked
                  submitLabel={`Email a code to ${contact.email}`}
                  profile={{ name: contact.name, phone: contact.phone }}
                  onVerified={(u) => {
                    setUser(u);
                    setAddress((a) => ({ ...a, fullName: a.fullName || contact.name, phone: a.phone || contact.phone }));
                    toast("You're signed in");
                    // Pull saved addresses for returning customers.
                    api<{ addresses: SavedAddress[] }>("/api/addresses")
                      .then(({ addresses: list }) => {
                        const mapped = list.map((a) => ({ ...a, addressLine2: a.addressLine2 ?? "" }));
                        setAddresses(mapped);
                        const def = mapped.find((a) => a.isDefault) ?? mapped[0];
                        if (def) setSelectedId(def.id);
                      })
                      .catch(() => undefined);
                  }}
                />
                <button onClick={() => setContactReady(false)} className="mt-4 text-sm text-gray-500 underline hover:text-wine">
                  Edit contact details
                </button>
              </div>
            )}
          </section>

          {/* 2. Address */}
          <section aria-labelledby="ship-heading" className={cn(!user && "opacity-50 select-none")} inert={!user}>
            <h2 id="ship-heading" className="font-heading text-2xl text-charcoal mb-6 border-b border-gold/20 pb-2 flex items-center gap-3">
              <StepBadge n={2} done={false} /> Shipping Address
            </h2>

            {addresses.length > 0 && (
              <fieldset className="space-y-3 mb-6">
                <legend className="sr-only">Choose a saved address</legend>
                {addresses.map((a) => (
                  <label key={a.id} className={cn("flex gap-3 p-4 border bg-white cursor-pointer", selectedId === a.id ? "border-wine" : "border-gray-200 hover:border-gold/50")}>
                    <input type="radio" name="address" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} className="mt-1 accent-wine" />
                    <span className="text-sm text-gray-600">
                      <span className="block text-charcoal font-medium">
                        {a.fullName} {a.isDefault && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-sm">Default</span>}
                      </span>
                      {a.addressLine1}
                      {a.addressLine2 && `, ${a.addressLine2}`}, {a.area}, {a.city}, {a.state} {a.pincode}
                      <span className="block mt-1">Phone: {a.phone}</span>
                    </span>
                  </label>
                ))}
                <label className={cn("flex gap-3 p-4 border bg-white cursor-pointer", selectedId === "new" ? "border-wine" : "border-gray-200 hover:border-gold/50")}>
                  <input type="radio" name="address" checked={selectedId === "new"} onChange={() => setSelectedId("new")} className="accent-wine" />
                  <span className="text-sm text-charcoal">Deliver to a new address</span>
                </label>
              </fieldset>
            )}

            {usingNew && (
              <>
                <AddressForm idPrefix="ship" values={address} onChange={setAddress} errors={errors} />
                <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-wine" />
                  Save this address for next time
                </label>
              </>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-cream p-6 border border-gold/20 lg:sticky lg:top-28">
            <h2 className="font-heading text-xl text-charcoal mb-6 border-b border-gold/20 pb-2">In Your Bag</h2>
            <ul className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-20 bg-baby-pink flex-shrink-0">
                    {item.product.imageUrl && <Image src={item.product.imageUrl} alt={item.product.name} fill sizes="64px" className="object-cover" />}
                    <span className="absolute -top-2 -right-2 bg-wine text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">{item.quantity}</span>
                  </div>
                  <div className="flex-grow flex flex-col justify-center min-w-0">
                    <p className="font-heading text-sm text-charcoal line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{[item.variant.size, item.variant.color].filter(Boolean).join(" · ")}</p>
                    {item.issue ? (
                      <p className="text-xs text-red-600 mt-1">Unavailable in this quantity</p>
                    ) : (
                      <p className="text-charcoal text-sm mt-1">{formatPrice(item.lineTotal)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-3 text-sm mb-6 border-t border-gold/20 pt-4">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd className="text-charcoal">{formatPrice(s.subtotal)}</dd>
              </div>
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
            {s.couponError && (
              <p className="text-xs text-red-600 mb-4">
                {s.couponCode}: {s.couponError}.{" "}
                <Link href="/cart" className="underline">
                  Update in bag
                </Link>
              </p>
            )}

            <div className="border-t border-gold/30 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-heading text-xl text-charcoal">Total</span>
                <span className="font-heading text-2xl text-charcoal font-semibold">{formatPrice(s.total)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">Inclusive of all taxes</p>
            </div>

            {notice && (
              <div role={notice.kind === "error" ? "alert" : "status"} className={cn("text-sm mb-4 p-3 border flex gap-2", notice.kind === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-gold/40 bg-white text-charcoal")}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {notice.text}{" "}
                  {notice.orderId && (
                    <Link href={`/account/orders/${notice.orderId}`} className="underline">
                      View order
                    </Link>
                  )}
                </span>
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={!user || placing || cart.hasIssues || Boolean(s.couponError)}
              className="w-full bg-gold text-white text-center py-4 font-medium tracking-wide hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {placing ? "Processing…" : `Place Order & Pay ${formatPrice(s.total)}`}
            </button>
            {!user && <p className="text-xs text-gray-500 mt-3 text-center">Confirm your email above to continue.</p>}
            {cart.hasIssues && (
              <p className="text-xs text-red-600 mt-3 text-center">
                Some items are unavailable.{" "}
                <Link href="/cart" className="underline">
                  Review your bag
                </Link>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-4 text-center">Secure payment by Razorpay. Online payments only.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span className={cn("w-7 h-7 rounded-full text-sm flex items-center justify-center font-body shrink-0", done ? "bg-green-600 text-white" : "bg-wine text-white")}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
    </span>
  );
}
