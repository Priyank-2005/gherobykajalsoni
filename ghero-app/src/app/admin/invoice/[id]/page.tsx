import { notFound, redirect } from "next/navigation";
import { AppError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { adminGetOrder } from "@/lib/services/order.service";
import { formatDate, formatPrice } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata = { title: "Invoice", robots: { index: false, follow: false } };

const STORE = {
  name: "Ghero by Kajal Soni",
  email: "gherobykajalsoni@gmail.com",
  phone: "+91 91668 80664",
};

/** Printable invoice (A4). Outside the admin shell so it prints cleanly. */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/admin/login");

  const { id } = await params;
  const order = await adminGetOrder(id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
      <div className="max-w-3xl mx-auto mb-4 flex justify-end gap-2 px-4 print:hidden">
        <PrintButton />
      </div>
      <article className="invoice max-w-3xl mx-auto bg-white p-10 shadow print:shadow-none print:p-0 text-sm text-charcoal">
        <header className="flex justify-between items-start border-b-2 border-gold pb-6 mb-6">
          <div>
            <p className="font-heading text-3xl text-gold">Ghero</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">by Kajal Soni</p>
            <p className="mt-3 text-gray-600">{STORE.email}</p>
            <p className="text-gray-600">{STORE.phone}</p>
          </div>
          <div className="text-right">
            <h1 className="font-heading text-2xl">Invoice</h1>
            <p className="mt-2">
              <span className="text-gray-500">Order</span> {order.orderNumber}
            </p>
            <p>
              <span className="text-gray-500">Date</span> {formatDate(order.createdAt)}
            </p>
            <p>
              <span className="text-gray-500">Payment</span> {order.payment?.status === "CAPTURED" ? "Paid online" : "Unpaid"}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Bill & ship to</h2>
            <p className="font-medium">{order.shipping.name}</p>
            <p>{order.shipping.address1}</p>
            {order.shipping.address2 && <p>{order.shipping.address2}</p>}
            <p>{order.shipping.area}</p>
            <p>
              {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
            </p>
            <p>{order.shipping.country}</p>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Contact</h2>
            <p>{order.shipping.email}</p>
            <p>{order.shipping.phone}</p>
            {order.payment?.razorpayPaymentId && <p className="mt-2 text-xs text-gray-500 font-mono">Payment ref {order.payment.razorpayPaymentId}</p>}
          </div>
        </section>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="py-2">Item</th>
              <th className="py-2">SKU</th>
              <th className="py-2 text-right">MRP</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-gray-100">
                <td className="py-2">
                  {i.productName}
                  {(i.size || i.color) && <span className="text-gray-500"> ({[i.size, i.color].filter(Boolean).join(", ")})</span>}
                </td>
                <td className="py-2 font-mono text-xs">{i.sku}</td>
                <td className="py-2 text-right tabular-nums text-gray-500">{formatPrice(i.unitMrp)}</td>
                <td className="py-2 text-right tabular-nums">{formatPrice(i.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{i.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto w-64 space-y-1">
          <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
          {order.couponCode && (
            <div className="flex justify-between"><dt className="text-gray-500">Coupon ({order.couponCode})</dt><dd className="tabular-nums">−{formatPrice(order.couponDiscount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-gray-500">Shipping</dt><dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 font-semibold text-base"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
          <p className="text-xs text-gray-500 text-right">Prices are inclusive of all taxes.</p>
        </dl>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          Thank you for shopping with {STORE.name}.
        </footer>
      </article>
      <style>{`@page { size: A4; margin: 16mm; }`}</style>
    </div>
  );
}
