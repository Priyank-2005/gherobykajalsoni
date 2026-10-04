"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { BarcodeSvg } from "@/components/pos/barcode-svg";
import { downloadLabels } from "@/components/pos/download";
import { useLabelOptions } from "@/components/pos/label-options";

type Variant = { id: string; barcode: string; sku: string; size: string | null; color: string | null; price: number; mrp: number; stock: number };

/** Choose how many labels per size (starts at one per piece in stock, or one each) and download. */
export function ProductLabels({ variants }: { variants: Variant[] }) {
  const toast = useToast();
  const [options] = useLabelOptions();
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const qty = (v: Variant) => {
    const typed = custom[v.id];
    if (typed !== undefined) return Math.max(0, Math.min(1000, Number(typed) || 0));
    return options.mode === "one" ? 1 : Math.max(0, v.stock);
  };
  const total = variants.reduce((s, v) => s + qty(v), 0);

  const download = async () => {
    setBusy(true);
    try {
      await downloadLabels({ lines: variants.map((v) => ({ variantId: v.id, quantity: qty(v) })).filter((l) => l.quantity > 0), startAt: options.startAt, guides: options.guides });
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!variants.length) return <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 text-center">This product has no sizes yet. Add them in Admin → Products.</p>;

  return (
    <div className="space-y-3">
      <ul className="bg-white border border-gray-200 rounded-xl divide-y">
        {variants.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex-1 min-w-[10rem]">
              <p className="font-medium">{[v.size && `Size ${v.size}`, v.color].filter(Boolean).join(" · ") || v.sku}</p>
              <p className="text-xs text-gray-500">
                {formatPrice(v.price)}
                {v.mrp > v.price && <span className="line-through ml-1">{formatPrice(v.mrp)}</span>} · {v.stock} in stock · SKU {v.sku}
              </p>
            </div>
            <BarcodeSvg value={v.barcode} height={34} className="w-36" />
            <label className="flex items-center gap-2 text-sm">
              Labels
              <input
                type="number"
                min={0}
                max={1000}
                value={custom[v.id] ?? String(qty(v))}
                onChange={(e) => setCustom({ ...custom, [v.id]: e.target.value })}
                className="w-20 h-10 border border-gray-300 rounded-md px-2 text-base tabular-nums"
              />
            </label>
          </li>
        ))}
      </ul>
      <button onClick={download} disabled={busy || total === 0} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-wine text-white px-6 h-12 font-medium disabled:opacity-50">
        <Download className="w-5 h-5" /> {busy ? "Preparing…" : `Download ${total} label${total === 1 ? "" : "s"} (PDF)`}
      </button>
    </div>
  );
}
