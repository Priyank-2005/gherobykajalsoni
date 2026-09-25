"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";

export function DeleteCategory({ categoryId, name, productCount }: { categoryId: string; name: string; productCount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const blocked = productCount > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
      <p className="text-gray-600">
        {blocked
          ? `This category has ${productCount} product${productCount === 1 ? "" : "s"}. Move them to another category first, or just hide the category.`
          : "Deleting removes the category and its subcategories permanently."}
      </p>
      <button
        disabled={busy || blocked}
        onClick={async () => {
          if (!confirm(`Delete "${name}" permanently?`)) return;
          setBusy(true);
          try {
            await api(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
            toast("Category deleted");
            router.push("/admin/categories");
            router.refresh();
          } catch (error) {
            toast(errorMessage(error), "error");
            setBusy(false);
          }
        }}
        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-40 shrink-0"
      >
        Delete category
      </button>
    </div>
  );
}
