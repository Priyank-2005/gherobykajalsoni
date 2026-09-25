"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";

export function DeleteProduct({ productId, name, isPublished }: { productId: string; name: string; isPublished: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, msg: string, then?: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast(msg);
      if (then) then();
      else router.refresh();
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
      <p className="text-gray-600">
        {isPublished ? "Unpublishing hides the product from the store but keeps it for later. " : ""}Deleting removes it permanently; past orders keep their own copy of the details.
      </p>
      <div className="flex gap-2 shrink-0">
        {isPublished && (
          <button disabled={busy} onClick={() => run(() => api(`/api/admin/products/${productId}`, { method: "PUT", body: { isPublished: false } }), "Product unpublished")} className="px-3 py-2 border border-gray-300 rounded-md hover:border-charcoal disabled:opacity-50">
            Unpublish
          </button>
        )}
        <button
          disabled={busy}
          onClick={() =>
            confirm(`Permanently delete "${name}"? This can't be undone.`) &&
            run(() => api(`/api/admin/products/${productId}`, { method: "DELETE" }), "Product deleted", () => {
              router.push("/admin/products");
              router.refresh();
            })
          }
          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Delete product
        </button>
      </div>
    </div>
  );
}
