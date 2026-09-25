"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Field, inputCls } from "@/components/admin/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";
import { ORDER_STATUS_LABELS, type OrderStatusType } from "@/types/order";

const HINTS: Partial<Record<OrderStatusType, string>> = {
  SHIPPED: "The customer is emailed the tracking link.",
  DELIVERED: "The customer is emailed a delivery confirmation.",
  CANCELLED: "Paid orders are restocked automatically. Refunds are issued from the Razorpay dashboard.",
};

export function OrderStatusForm({
  orderId,
  status,
  allowed,
  trackingUrl,
  notes,
  stockCommitted,
}: {
  orderId: string;
  status: OrderStatusType;
  allowed: OrderStatusType[];
  trackingUrl: string | null;
  notes: string | null;
  stockCommitted: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [next, setNext] = useState<OrderStatusType>(allowed[0] ?? status);
  const [tracking, setTracking] = useState(trackingUrl ?? "");
  const [note, setNote] = useState(notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async (body: Record<string, unknown>, success: string) => {
    if (body.status === "CANCELLED" && !confirm(`Cancel this order?${stockCommitted ? " Its items will be restocked." : ""}`)) return;
    setBusy(true);
    setErrors({});
    try {
      await api(`/api/admin/orders/${orderId}`, { method: "PATCH", body });
      toast(success);
      router.refresh();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const needsTracking = next === "SHIPPED";

  return (
    <div className="space-y-6">
      {allowed.length > 0 ? (
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save({ status: next, ...(needsTracking || tracking ? { trackingUrl: tracking.trim() || undefined } : {}) }, `Order marked ${ORDER_STATUS_LABELS[next]}`);
          }}
        >
          <Field label="Move to" htmlFor="next-status" hint={HINTS[next]}>
            <select id="next-status" value={next} onChange={(e) => setNext(e.target.value as OrderStatusType)} className={inputCls}>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          {(needsTracking || status === "SHIPPED") && (
            <Field label={`Tracking URL${needsTracking ? " *" : ""}`} htmlFor="tracking" error={errors.trackingUrl}>
              <input
                id="tracking"
                type="url"
                inputMode="url"
                placeholder="https://courier.example/track/…"
                required={needsTracking}
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                className={inputCls}
              />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={busy} variant={next === "CANCELLED" ? "secondary" : "primary"}>
              {next === "CANCELLED" ? "Cancel order" : `Mark as ${ORDER_STATUS_LABELS[next]}`}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          {status === "DELIVERED" || status === "CANCELLED" ? "This order is closed." : "Status changes automatically when the customer pays."}
        </p>
      )}

      <form
        className="space-y-3 pt-6 border-t border-gray-100"
        onSubmit={(e) => {
          e.preventDefault();
          save({ status, notes: note, ...(status === "SHIPPED" && tracking ? { trackingUrl: tracking.trim() } : {}) }, "Notes saved");
        }}
      >
        <Field label="Internal notes" htmlFor="notes" hint="Only visible to admins. Clearing the note removes the 'Needs review' flag.">
          <textarea id="notes" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </Field>
        <Button type="submit" variant="secondary" size="sm" isLoading={busy}>
          Save notes
        </Button>
      </form>
    </div>
  );
}
