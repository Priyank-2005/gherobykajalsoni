"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Field, Toggle, inputCls } from "./ui";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";
import { slugify } from "@/lib/utils";

export type CategoryOption = { id: string; name: string; subcategories: { id: string; name: string }[] };

export type ProductFormValues = {
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId: string;
  basePrice: string;
  baseMrp: string;
  description: string;
  fabric: string;
  careInstructions: string;
  sizeGuide: string;
  isPublished: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
};

export const emptyProduct: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  subcategoryId: "",
  basePrice: "",
  baseMrp: "",
  description: "",
  fabric: "",
  careInstructions: "",
  sizeGuide: "",
  isPublished: false,
  isNewArrival: false,
  isBestseller: false,
};

/** Create (productId undefined) or edit product details. Category → subcategory is a dependent pair. */
export function ProductForm({ productId, initial, categories }: { productId?: string; initial: ProductFormValues; categories: CategoryOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProductFormValues>(k: K, value: ProductFormValues[K]) => setV((prev) => ({ ...prev, [k]: value }));

  const subcategories = categories.find((c) => c.id === v.categoryId)?.subcategories ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = {
      name: v.name.trim(),
      ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
      categoryId: v.categoryId,
      subcategoryId: v.subcategoryId || null,
      basePrice: Number(v.basePrice),
      baseMrp: Number(v.baseMrp),
      description: v.description.trim() || null,
      fabric: v.fabric.trim() || null,
      careInstructions: v.careInstructions.trim() || null,
      sizeGuide: v.sizeGuide.trim() || null,
      isPublished: v.isPublished,
      isNewArrival: v.isNewArrival,
      isBestseller: v.isBestseller,
    };
    try {
      if (productId) {
        await api(`/api/admin/products/${productId}`, { method: "PUT", body });
        toast("Product saved");
        router.refresh();
      } else {
        const { product } = await api<{ product: { id: string } }>("/api/admin/products", { body });
        toast("Product created. Now add variants and images.");
        router.push(`/admin/products/${product.id}`);
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Product name *" htmlFor="p-name" error={errors.name} className="md:col-span-2">
          <input id="p-name" required value={v.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="URL slug" htmlFor="p-slug" error={errors.slug} hint={`/product/${v.slug || slugify(v.name) || "…"}${productId ? "" : " (auto from name if empty)"}`} className="md:col-span-2">
          <input id="p-slug" value={v.slug} placeholder={slugify(v.name)} onChange={(e) => set("slug", e.target.value.toLowerCase())} className={inputCls} />
        </Field>

        <Field label="Category *" htmlFor="p-cat" error={errors.categoryId}>
          <select
            id="p-cat"
            required
            value={v.categoryId}
            onChange={(e) => setV((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: "" }))}
            className={inputCls}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Subcategory"
          htmlFor="p-sub"
          error={errors.subcategoryId}
          hint={v.categoryId && subcategories.length === 0 ? "This category has no subcategories." : "Optional"}
        >
          <select id="p-sub" value={v.subcategoryId} disabled={!v.categoryId || subcategories.length === 0} onChange={(e) => set("subcategoryId", e.target.value)} className={inputCls}>
            <option value="">{v.categoryId ? "None" : "Choose a category first"}</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Selling price (₹) *" htmlFor="p-price" error={errors.basePrice} hint="Shown on product cards. Each variant has its own price.">
          <input id="p-price" required type="number" min={1} step="0.01" inputMode="decimal" value={v.basePrice} onChange={(e) => set("basePrice", e.target.value)} className={inputCls} />
        </Field>
        <Field label="MRP (₹) *" htmlFor="p-mrp" error={errors.baseMrp} hint="Struck-through price; discount % is calculated from this.">
          <input id="p-mrp" required type="number" min={1} step="0.01" inputMode="decimal" value={v.baseMrp} onChange={(e) => set("baseMrp", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Description" htmlFor="p-desc" className="md:col-span-2">
          <textarea id="p-desc" rows={4} value={v.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Fabric" htmlFor="p-fabric">
          <input id="p-fabric" value={v.fabric} onChange={(e) => set("fabric", e.target.value)} className={inputCls} placeholder="e.g. Pure Banarasi silk" />
        </Field>
        <Field label="Care instructions" htmlFor="p-care">
          <input id="p-care" value={v.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} className={inputCls} placeholder="e.g. Dry clean only" />
        </Field>
        <Field label="Size guide" htmlFor="p-size" className="md:col-span-2" hint="Shown in the Size Guide section. One line per row.">
          <textarea id="p-size" rows={3} value={v.sizeGuide} onChange={(e) => set("sizeGuide", e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 py-4 border-y border-gray-100">
        <Toggle checked={v.isPublished} onChange={(x) => set("isPublished", x)} label="Published (visible in store)" />
        <Toggle checked={v.isNewArrival} onChange={(x) => set("isNewArrival", x)} label="New arrival" />
        <Toggle checked={v.isBestseller} onChange={(x) => set("isBestseller", x)} label="Bestseller" />
      </div>

      <Button type="submit" isLoading={busy} size="lg">
        {productId ? "Save product" : "Create product"}
      </Button>
    </form>
  );
}
