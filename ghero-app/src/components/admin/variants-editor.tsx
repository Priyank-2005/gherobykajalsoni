"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  mrp: number;
  stock: number;
  isAvailable: boolean;
};

type Row = { sku: string; size: string; color: string; colorHex: string; price: string; mrp: string; stock: string; isAvailable: boolean };

const toRow = (v: Variant): Row => ({
  sku: v.sku,
  size: v.size ?? "",
  color: v.color ?? "",
  colorHex: v.colorHex ?? "#cccccc",
  price: String(v.price),
  mrp: String(v.mrp),
  stock: String(v.stock),
  isAvailable: v.isAvailable,
});

const toBody = (r: Row) => ({
  sku: r.sku.trim(),
  size: r.size.trim() || null,
  color: r.color.trim() || null,
  colorHex: r.color.trim() ? r.colorHex : null,
  price: Number(r.price),
  mrp: Number(r.mrp),
  stock: Math.max(0, Math.floor(Number(r.stock))),
  isAvailable: r.isAvailable,
});

const cell = "border border-gray-300 rounded px-2 py-1.5 text-sm w-full bg-white focus:outline-none focus:border-wine";

/** One row per size/colour combination. Each row saves independently. */
export function VariantsEditor({ productId, variants, defaults }: { productId: string; variants: Variant[]; defaults: { price: number; mrp: number } }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Record<string, Row>>(() => Object.fromEntries(variants.map((v) => [v.id, toRow(v)])));
  const [busy, setBusy] = useState<string | null>(null);
  const blank: Row = { sku: "", size: "", color: "", colorHex: "#cccccc", price: String(defaults.price), mrp: String(defaults.mrp), stock: "0", isAvailable: true };
  const [draft, setDraft] = useState<Row>(blank);

  const run = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast(msg);
      router.refresh();
      return true;
    } catch (error) {
      toast(errorMessage(error), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  // Rows for variants added after mount aren't in local state until edited.
  const dirty = (v: Variant) => Boolean(rows[v.id]) && JSON.stringify(toRow(v)) !== JSON.stringify(rows[v.id]);

  const inputs = (r: Row, onChange: (r: Row) => void) => (
    <>
      <td className="p-1.5"><input aria-label="SKU" value={r.sku} onChange={(e) => onChange({ ...r, sku: e.target.value.toUpperCase() })} className={cn(cell, "font-mono min-w-[9rem]")} /></td>
      <td className="p-1.5"><input aria-label="Size" value={r.size} onChange={(e) => onChange({ ...r, size: e.target.value })} className={cn(cell, "min-w-[5rem]")} placeholder="M" /></td>
      <td className="p-1.5">
        <div className="flex items-center gap-1.5 min-w-[9rem]">
          <input aria-label="Colour swatch" type="color" value={r.colorHex} onChange={(e) => onChange({ ...r, colorHex: e.target.value })} className="w-8 h-8 border border-gray-300 rounded shrink-0 p-0.5 bg-white" />
          <input aria-label="Colour name" value={r.color} onChange={(e) => onChange({ ...r, color: e.target.value })} className={cell} placeholder="Maroon" />
        </div>
      </td>
      <td className="p-1.5"><input aria-label="Price" type="number" min={1} step="0.01" value={r.price} onChange={(e) => onChange({ ...r, price: e.target.value })} className={cn(cell, "min-w-[6rem] text-right")} /></td>
      <td className="p-1.5"><input aria-label="MRP" type="number" min={1} step="0.01" value={r.mrp} onChange={(e) => onChange({ ...r, mrp: e.target.value })} className={cn(cell, "min-w-[6rem] text-right")} /></td>
      <td className="p-1.5"><input aria-label="Stock" type="number" min={0} step={1} value={r.stock} onChange={(e) => onChange({ ...r, stock: e.target.value })} className={cn(cell, "min-w-[4.5rem] text-right")} /></td>
      <td className="p-1.5 text-center"><input aria-label="Available" type="checkbox" checked={r.isAvailable} onChange={(e) => onChange({ ...r, isAvailable: e.target.checked })} className="w-4 h-4 accent-wine" /></td>
    </>
  );

  const head = "text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-1.5 py-2";

  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full min-w-[820px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className={head}>SKU</th>
            <th className={head}>Size</th>
            <th className={head}>Colour</th>
            <th className={`${head} text-right`}>Price ₹</th>
            <th className={`${head} text-right`}>MRP ₹</th>
            <th className={`${head} text-right`}>Stock</th>
            <th className={`${head} text-center`}>On sale</th>
            <th className={head} />
          </tr>
        </thead>
        <tbody>
          {variants.length === 0 && (
            <tr>
              <td colSpan={8} className="text-sm text-amber-700 py-3">Add at least one variant. Customers can&apos;t buy a product without one.</td>
            </tr>
          )}
          {variants.map((v) => (
            <tr key={v.id} className="border-b border-gray-100">
              {inputs(rows[v.id] ?? toRow(v), (r) => setRows({ ...rows, [v.id]: r }))}
              <td className="p-1.5 whitespace-nowrap">
                <button
                  type="button"
                  disabled={!dirty(v) || busy !== null}
                  onClick={() => run(v.id, () => api(`/api/admin/products/${productId}/variants/${v.id}`, { method: "PUT", body: toBody(rows[v.id]) }), "Variant saved")}
                  className="text-xs px-2.5 py-1.5 rounded bg-wine text-white disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {busy === v.id ? "…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  aria-label={`Delete ${v.sku}`}
                  onClick={() => confirm(`Delete variant ${v.sku}?`) && run(v.id, () => api(`/api/admin/products/${productId}/variants/${v.id}`, { method: "DELETE" }), "Variant deleted")}
                  className="ml-1 p-1.5 text-gray-400 hover:text-red-600 align-middle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            {inputs(draft, setDraft)}
            <td className="p-1.5">
              <button
                type="button"
                disabled={!draft.sku.trim() || busy !== null}
                onClick={async () => {
                  const okay = await run("new", () => api(`/api/admin/products/${productId}/variants`, { body: toBody(draft) }), "Variant added");
                  if (okay) setDraft({ ...blank, color: draft.color, colorHex: draft.colorHex });
                }}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-wine text-wine hover:bg-wine hover:text-white disabled:opacity-40 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">Tip: add one row per size (and colour). SKUs must be unique across the store.</p>
    </div>
  );
}
