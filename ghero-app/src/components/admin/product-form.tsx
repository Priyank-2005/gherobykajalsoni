"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Field, Toggle, inputCls } from "./ui";
import { MediaUpload } from "./media-upload";
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
  isViral: boolean;
  viralVideoUrl: string;
  viralVideoCloudinaryId: string;
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
  isViral: false,
  viralVideoUrl: "",
  viralVideoCloudinaryId: "",
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
    if (v.isViral && !v.viralVideoUrl) {
      setErrors({ viralVideoUrl: "A video is required for viral products." });
      toast("Upload the viral video, or turn off \"Viral product\".", "error");
      return;
    }
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
      isViral: v.isViral,
      viralVideoUrl: v.viralVideoUrl || null,
      viralVideoCloudinaryId: v.viralVideoCloudinaryId || null,
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
        <Toggle checked={v.isViral} onChange={(x) => set("isViral", x)} label="Viral product" />
      </div>

      {(v.isViral || v.viralVideoUrl) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Viral video {v.isViral && <span className="text-red-600">*</span>}</h3>
              <p className="text-xs text-gray-500 mt-0.5 max-w-md">
                {v.isViral
                  ? "The influencer reel shown in the homepage \"Viral Products\" section. Shoppers tap it to open this product. Vertical (9:16) MP4, WebM or MOV up to 100 MB."
                  : "Kept for later, but not shown on the homepage while \"Viral product\" is off."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MediaUpload
                kind="productVideo"
                accept="video/mp4,video/webm,video/quicktime"
                label={v.viralVideoUrl ? "Replace video" : "Upload video"}
                onUploaded={(m) => {
                  setV((prev) => ({ ...prev, viralVideoUrl: m.url, viralVideoCloudinaryId: m.cloudinaryId }));
                  setErrors((prev) => ({ ...prev, viralVideoUrl: "" }));
                }}
              />
              {v.viralVideoUrl && (
                <button
                  type="button"
                  onClick={() => setV((prev) => ({ ...prev, viralVideoUrl: "", viralVideoCloudinaryId: "" }))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {v.viralVideoUrl ? (
            <video src={v.viralVideoUrl} controls muted playsInline className="mt-3 w-40 aspect-[9/16] object-cover bg-black rounded" />
          ) : (
            <p className="mt-3 text-sm text-gray-500">No video uploaded yet.</p>
          )}
          {errors.viralVideoUrl && <p className="text-xs text-red-600 mt-2">{errors.viralVideoUrl}</p>}
          {productId && <p className="text-xs text-gray-500 mt-2">Changes to the video are saved when you click &ldquo;Save product&rdquo;.</p>}
        </div>
      )}

      <Button type="submit" isLoading={busy} size="lg">
        {productId ? "Save product" : "Create product"}
      </Button>
    </form>
  );
}
