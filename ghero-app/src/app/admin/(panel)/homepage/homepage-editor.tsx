"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Field, Pill, Toggle, inputCls } from "@/components/admin/ui";
import { MediaUpload, type UploadKind } from "@/components/admin/media-upload";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };
type Option = { id: string; name: string; slug: string };

type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "link"; required?: boolean; hint?: string }
  | { key: string; label: string; type: "rating" }
  | { key: string; label: string; type: "media"; idKey: string; upload: UploadKind; accept?: string; required?: boolean; typeKey?: string; hint?: string }
  | { key: string; label: string; type: "category" | "product"; hint?: string };

type Section = {
  key: "hero" | "categories" | "reels" | "testimonials";
  label: string;
  singular: string;
  help: string;
  fields: FieldDef[];
  title: (r: Row) => string;
  thumb: (r: Row) => string | null;
};

const SECTIONS: Section[] = [
  {
    key: "hero",
    label: "Hero slides",
    singular: "slide",
    help: "Slides with button text show the heading and buttons; slides without are image-only links.",
    fields: [
      { key: "imageUrl", label: "Desktop image *", type: "media", idKey: "imageCloudinaryId", upload: "heroImage", required: true, hint: "Landscape, at least 1920px wide" },
      { key: "mobileImageUrl", label: "Mobile image", type: "media", idKey: "mobileCloudinaryId", upload: "heroMobileImage", hint: "Portrait (optional)" },
      { key: "heading", label: "Heading *", type: "text", required: true, hint: "Also used as the image description" },
      { key: "subheading", label: "Subheading", type: "text" },
      { key: "ctaText", label: "Button text", type: "text", hint: "Leave empty for an image-only slide" },
      { key: "ctaUrl", label: "Button / slide link", type: "link", hint: "e.g. /shop?sort=newest or /category/sarees" },
      { key: "secondaryCtaText", label: "Second button text", type: "text" },
      { key: "secondaryCtaUrl", label: "Second button link", type: "link" },
    ],
    title: (r) => String(r.heading ?? ""),
    thumb: (r) => (r.imageUrl as string) ?? null,
  },
  {
    key: "categories",
    label: "Shop by Category",
    singular: "tile",
    help: "The category tiles on the homepage. Link a tile to a category, or to any page.",
    fields: [
      { key: "name", label: "Label *", type: "text", required: true },
      { key: "imageUrl", label: "Image *", type: "media", idKey: "cloudinaryId", upload: "categoryImage", required: true, hint: "Portrait 3:4 works best" },
      { key: "categoryId", label: "Category", type: "category", hint: "Choosing one fills the link automatically" },
      { key: "link", label: "Link *", type: "link", required: true },
    ],
    title: (r) => String(r.name ?? ""),
    thumb: (r) => (r.imageUrl as string) ?? null,
  },
  {
    key: "reels",
    label: "Shop by Reels",
    singular: "reel",
    help: "Short videos or images. Link each to a product so customers can shop the look.",
    fields: [
      { key: "mediaUrl", label: "Video or image *", type: "media", idKey: "cloudinaryId", upload: "reelMedia", accept: "video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp", required: true, typeKey: "mediaType", hint: "Vertical 9:16" },
      { key: "caption", label: "Caption", type: "text" },
      { key: "productId", label: "Product", type: "product", hint: "Tapping the reel opens this product" },
      { key: "link", label: "Custom link", type: "link", hint: "Optional; overrides the product link" },
    ],
    title: (r) => String(r.caption ?? "Reel"),
    thumb: (r) => (r.mediaType === "image" ? ((r.mediaUrl as string) ?? null) : ((r.thumbnail as string) ?? null)),
  },
  {
    key: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    help: "Customer reviews shown in the carousel.",
    fields: [
      { key: "customerName", label: "Customer name *", type: "text", required: true },
      { key: "review", label: "Review *", type: "textarea", required: true },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "productName", label: "Product purchased", type: "text" },
      { key: "imageUrl", label: "Photo", type: "media", idKey: "cloudinaryId", upload: "testimonialImage" },
    ],
    title: (r) => String(r.customerName ?? ""),
    thumb: (r) => (r.imageUrl as string) ?? null,
  },
];

export function HomepageEditor({
  data,
  initialTab,
  categoryOptions,
  productOptions,
}: {
  data: Record<Section["key"], Record<string, unknown>[]>;
  initialTab?: string;
  categoryOptions: Option[];
  productOptions: Option[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Section["key"]>(SECTIONS.some((s) => s.key === initialTab) ? (initialTab as Section["key"]) : "hero");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const section = SECTIONS.find((s) => s.key === tab)!;
  const rows = data[tab] as Row[];
  const base = `/api/admin/homepage/${tab}`;

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast(msg);
      router.refresh();
      return true;
    } catch (error) {
      toast(errorMessage(error), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const open = (row: Row | "new") => {
    setEditing(row);
    setErrors({});
    setValues(row === "new" ? { isVisible: true, rating: 5, displayOrder: rows.length } : { ...row });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    // Send only this section's fields (plus media id/type keys), with empty strings as null.
    const body: Record<string, unknown> = { isVisible: values.isVisible !== false };
    for (const f of section.fields) {
      const val = values[f.key];
      body[f.key] = typeof val === "string" ? val.trim() || null : (val ?? null);
      if (f.type === "media") {
        body[f.idKey] = values[f.idKey] ?? null;
        if (f.typeKey) body[f.typeKey] = values[f.typeKey] ?? "image";
      }
    }
    if (editing === "new") body.displayOrder = rows.length;
    setBusy(true);
    try {
      if (editing === "new") await api(base, { body: stripNulls(body) });
      else if (editing) await api(`${base}/${editing.id}`, { method: "PUT", body });
      toast("Saved");
      setEditing(null);
      router.refresh();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, delta: number) => {
    const a = rows[index];
    const b = rows[index + delta];
    await act(async () => {
      // Normalise to list positions, then swap the two.
      await api(`${base}/${a.id}`, { method: "PUT", body: { displayOrder: index + delta } });
      await api(`${base}/${b.id}`, { method: "PUT", body: { displayOrder: index } });
    }, "Order updated");
  };

  return (
    <>
      <div className="flex gap-1 overflow-x-auto hide-scrollbar border-b border-gray-200 mb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setTab(s.key);
              router.replace(`/admin/homepage?tab=${s.key}`, { scroll: false });
            }}
            className={cn("px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px", tab === s.key ? "border-wine text-wine font-medium" : "border-transparent text-gray-500 hover:text-charcoal")}
          >
            {s.label} <span className="text-xs text-gray-400">{data[s.key].length}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500">{section.help}</p>
        <button onClick={() => open("new")} className="inline-flex items-center gap-2 bg-wine text-white rounded-md px-4 py-2 text-sm hover:bg-wine/90">
          <Plus className="w-4 h-4" /> Add {section.singular}
        </button>
      </div>

      <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {rows.length === 0 && <li className="p-6 text-sm text-gray-500 text-center">Nothing here yet. This section is hidden on the homepage until you add something.</li>}
        {rows.map((r, i) => {
          const thumb = section.thumb(r);
          return (
            <li key={r.id} className={cn("flex items-center gap-3 p-3", r.isVisible === false && "bg-gray-50")}>
              <div className="flex flex-col">
                <button disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="p-0.5 text-gray-400 hover:text-charcoal disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                <button disabled={busy || i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="p-0.5 text-gray-400 hover:text-charcoal disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
              </div>
              <div className="relative w-16 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                {thumb && <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{section.title(r) || "(untitled)"}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {r.isVisible === false && <Pill>Hidden</Pill>}
                  {tab === "hero" && <Pill tone="gold">{r.ctaText ? "Headline + buttons" : "Image only"}</Pill>}
                  {tab === "reels" && <Pill>{String(r.mediaType)}</Pill>}
                </div>
              </div>
              <Toggle checked={r.isVisible !== false} disabled={busy} onChange={(x) => act(() => api(`${base}/${r.id}`, { method: "PUT", body: { isVisible: x } }), x ? "Shown" : "Hidden")} label="" />
              <button onClick={() => open(r)} aria-label="Edit" className="p-2 text-gray-500 hover:text-wine"><Pencil className="w-4 h-4" /></button>
              <button
                disabled={busy}
                onClick={() => confirm("Delete this item?") && act(() => api(`${base}/${r.id}`, { method: "DELETE" }), "Deleted")}
                aria-label="Delete"
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`${editing === "new" ? "Add" : "Edit"} ${section.singular}`} className="sm:max-w-xl" dismissible={!busy}>
        <form onSubmit={save} className="space-y-4">
          {section.fields.map((f) => (
            <FieldInput
              key={f.key}
              def={f}
              values={values}
              setValues={setValues}
              error={errors[f.key] ?? (f.type === "media" ? errors[f.idKey] : undefined)}
              categoryOptions={categoryOptions}
              productOptions={productOptions}
            />
          ))}
          <Toggle checked={values.isVisible !== false} onChange={(x) => setValues({ ...values, isVisible: x })} label="Visible on homepage" />
          <Button type="submit" fullWidth size="lg" isLoading={busy}>Save</Button>
        </form>
      </Modal>
    </>
  );
}

function stripNulls(o: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));
}

function FieldInput({
  def,
  values,
  setValues,
  error,
  categoryOptions,
  productOptions,
}: {
  def: FieldDef;
  values: Record<string, unknown>;
  setValues: (v: Record<string, unknown>) => void;
  error?: string;
  categoryOptions: Option[];
  productOptions: Option[];
}) {
  const id = `hp-${def.key}`;
  const str = (k: string) => (values[k] as string | null | undefined) ?? "";

  switch (def.type) {
    case "text":
    case "link":
      return (
        <Field label={def.label} htmlFor={id} hint={def.hint} error={error}>
          <input id={id} required={def.required} value={str(def.key)} placeholder={def.type === "link" ? "/shop" : undefined} onChange={(e) => setValues({ ...values, [def.key]: e.target.value })} className={inputCls} />
        </Field>
      );
    case "textarea":
      return (
        <Field label={def.label} htmlFor={id} error={error}>
          <textarea id={id} required={def.required} rows={4} value={str(def.key)} onChange={(e) => setValues({ ...values, [def.key]: e.target.value })} className={inputCls} />
        </Field>
      );
    case "rating":
      return (
        <Field label={def.label} htmlFor={id}>
          <select id={id} value={Number(values[def.key] ?? 5)} onChange={(e) => setValues({ ...values, [def.key]: Number(e.target.value) })} className={inputCls}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
          </select>
        </Field>
      );
    case "category":
      return (
        <Field label={def.label} htmlFor={id} hint={def.hint}>
          <select
            id={id}
            value={str(def.key)}
            onChange={(e) => {
              const cat = categoryOptions.find((c) => c.id === e.target.value);
              setValues({ ...values, categoryId: e.target.value || null, ...(cat ? { link: `/category/${cat.slug}`, name: values.name || cat.name } : {}) });
            }}
            className={inputCls}
          >
            <option value="">None</option>
            {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      );
    case "product":
      return (
        <Field label={def.label} htmlFor={id} hint={def.hint}>
          <select id={id} value={str(def.key)} onChange={(e) => setValues({ ...values, productId: e.target.value || null })} className={inputCls}>
            <option value="">None</option>
            {productOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      );
    case "media": {
      const url = str(def.key);
      const isVideo = def.typeKey ? values[def.typeKey] === "video" : false;
      return (
        <Field label={def.label} htmlFor={id} hint={def.hint} error={error}>
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
              {url && (isVideo ? <video src={url} muted className="w-full h-full object-cover" /> : <Image src={url} alt="" fill sizes="80px" className="object-cover" />)}
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <MediaUpload
                kind={def.upload}
                accept={def.accept}
                label={url ? "Replace" : "Upload"}
                onUploaded={(m) => setValues({ ...values, [def.key]: m.url, [def.idKey]: m.cloudinaryId, ...(def.typeKey ? { [def.typeKey]: m.resourceType } : {}) })}
              />
              {url && !def.required && (
                <button type="button" onClick={() => setValues({ ...values, [def.key]: null, [def.idKey]: null })} className="block text-xs text-red-600 hover:underline">
                  Remove
                </button>
              )}
              <input id={id} className="sr-only" tabIndex={-1} required={def.required} value={url} onChange={() => undefined} aria-hidden />
            </div>
          </div>
        </Field>
      );
    }
  }
}
