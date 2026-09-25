"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useStore } from "@/components/storefront/store-provider";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/api-client";
import { payForOrder } from "@/lib/pay-for-order";
import { formatPrice } from "@/lib/utils";

/** Retry payment for a PENDING_PAYMENT order (e.g. after closing the Razorpay window). */
export function PayNowButton({ orderId, total }: { orderId: string; total: number }) {
  const router = useRouter();
  const toast = useToast();
  const { refreshCart } = useStore();
  const [busy, setBusy] = useState(false);

  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          const result = await payForOrder(orderId);
          if (result === "cancelled") return;
          await refreshCart();
          toast(result === "paid" ? "Payment received. Thank you!" : "Payment is being confirmed. This page will update shortly.", "success");
          router.replace(`/account/orders/${orderId}?placed=1`);
          router.refresh();
        } catch (error) {
          toast(errorMessage(error), "error");
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="flex items-center gap-2 bg-gold text-white px-6 py-3 text-sm font-medium hover:bg-gold-dark transition-colors disabled:opacity-50"
    >
      <Lock className="w-4 h-4" />
      {busy ? "Opening payment…" : `Pay ${formatPrice(total)}`}
    </button>
  );
}
