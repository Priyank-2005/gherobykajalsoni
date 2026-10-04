"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";
import { BarcodeSvg } from "@/components/pos/barcode-svg";
import { downloadLabelsFor } from "@/components/pos/download";

type Variant = { id: string; sku: string; size: string | null; color: string | null; stock: number; barcode: string; supplierCodes: { id: string; code: string }[] };

/**
 * Each size/colour's barcode (created automatically), optional supplier barcodes that the POS
 * also recognises, and label downloads for this product.
 */
export function VariantBarcodes({ productId, variants }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const pieces = variants.reduce((s, v) => s + Math.max(0, v.stock), 0);

  const run = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      if (msg) toast(msg);
      router.refresh();
      return true;
    } catch (e) {
      toast(errorMessage(e), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (!variants.length) return <p className="text-sm text-gray-500">Add a variant above; its barcode is created automatically.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy !== null || pieces === 0} onClick={() => run("dl-stock", () => downloadLabelsFor({ scope: "product", id: productId, mode: "stock" }), "")} className="inline-flex items-center gap-1.5 rounded-md bg-wine text-white px-3 py-2 text-sm disabled:opacity-50">
          <Download className="w-4 h-4" /> Labels: one per piece ({pieces})
        </button>
        <button type="button" disabled={busy !== null} onClick={() => run("dl-one", () => downloadLabelsFor({ scope: "product", id: productId, mode: "one" }), "")} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:border-wine disabled:opacity-50">
          <Download className="w-4 h-4" /> One per size ({variants.length})
        </button>
      </div>
      <ul className="divide-y divide-gray-100 -my-2">
        {variants.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-4 py-3">
            <div className="w-40 shrink-0">
              <BarcodeSvg value={v.barcode} height={30} />
            </div>
            <div className="flex-1 min-w-[12rem] text-sm">
              <p className="font-medium">{[v.size, v.color].filter(Boolean).join(" · ") || "—"} <span className="font-mono text-xs text-gray-400">{v.sku}</span></p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {v.supplierCodes.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono">
                    {c.code}
                    <button type="button" aria-label={`Remove supplier barcode ${c.code}`} disabled={busy !== null} onClick={() => run(c.id, () => api(`/api/admin/products/${productId}/variants/${v.id}/barcodes/${c.id}`, { method: "DELETE" }), "Supplier barcode removed")} className="text-gray-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {adding === v.id ? (
                  <form
                    className="flex items-center gap-1"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const ok = await run(`add-${v.id}`, () => api(`/api/admin/products/${productId}/variants/${v.id}/barcodes`, { body: { code: code.trim() } }), "Supplier barcode linked");
                      if (ok) {
                        setAdding(null);
                        setCode("");
                      }
                    }}
                  >
                    <input autoFocus aria-label="Supplier barcode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Scan or type" className="border border-gray-300 rounded px-2 py-1 text-xs font-mono w-36" />
                    <button type="submit" disabled={!code.trim() || busy !== null} className="text-xs text-wine px-1 disabled:opacity-50">Link</button>
                    <button type="button" onClick={() => setAdding(null)} className="text-xs text-gray-500 px-1">Cancel</button>
                  </form>
                ) : (
                  <button type="button" onClick={() => { setAdding(v.id); setCode(""); }} className="inline-flex items-center gap-0.5 text-xs text-gray-500 hover:text-wine">
                    <Plus className="w-3 h-3" /> Supplier barcode
                  </button>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-500 tabular-nums">{v.stock} in stock</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">Print at 100% (Actual size) on A4: 65 labels per sheet. Supplier barcodes are for bought-in stock that already carries an EAN/UPC code.</p>
    </div>
  );
}
