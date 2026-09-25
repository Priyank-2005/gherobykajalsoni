"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";
import { cn, slugify } from "@/lib/utils";
import { Field, Toggle, inputCls } from "./ui";
import { MediaUpload } from "./media-upload";

type Sub = { key: string; id?: string; name: string; slug: string; isVisible: boolean; productCount?: number };

export type CategoryEditorValue = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isVisible: boolean;
  image: string | null;
  subcategories: { id: string; name: string; slug: string; isVisible: boolean; productCount: number }[];
};

let keySeq = 0;
const newKey = () => `new-${++keySeq}`;

/**
 * Category + its subcategory list in one form. Saving sends the full list:
 * rows with an id are updated, new rows created, removed rows deleted (server-side, in one transaction).
 */
export function CategoryEditor({ initial }: { initial: CategoryEditorValue }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ name: initial.name, slug: initial.slug, description: initial.description, displayOrder: initial.displayOrder, isVisible: initial.isVisible });
  const [subs, setSubs] = useState<Sub[]>(initial.subcategories.map((s) => ({ ...s, key: s.id })));
  const [newSub, setNewSub] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const removed = initial.subcategories.filter((s) => !subs.some((x) => x.id === s.id));
  const affected = removed.reduce((n, s) => n + s.productCount, 0);

  const addSub = () => {
    const name = newSub.trim();
    if (!name) return;
    if (subs.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast(`"${name}" is already in the list`, "error");
      return;
    }
    setSubs([...subs, { key: newKey(), name, slug: "", isVisible: true }]);
    setNewSub("");
  };

  const move = (i: number, d: number) => {
    const next = [...subs];
    const [row] = next.splice(i, 1);
    next.splice(i + d, 0, row);
    setSubs(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (affected > 0 && !confirm(`${affected} product(s) use the subcategories you removed. They'll keep their category but lose the subcategory. Continue?`)) return;
    setBusy(true);
    setErrors({});
    const body = {
      name: v.name.trim(),
      ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
      description: v.description.trim() || undefined,
      displayOrder: Number(v.displayOrder) || 0,
      isVisible: v.isVisible,
      subcategories: subs.map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        name: s.name.trim(),
        ...(s.slug.trim() ? { slug: s.slug.trim() } : {}),
        displayOrder: i,
        isVisible: s.isVisible,
      })),
    };
    try {
      if (initial.id) {
        await api(`/api/admin/categories/${initial.id}`, { method: "PUT", body });
        toast("Category saved");
        router.refresh();
      } else {
        const { category } = await api<{ category: { id: string } }>("/api/admin/categories", { body });
        toast("Category created");
        router.push(`/admin/categories/${category.id}`);
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      toast(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Category name *" htmlFor="c-name" error={errors.name}>
          <input id="c-name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="URL slug" htmlFor="c-slug" error={errors.slug} hint={`/category/${v.slug || slugify(v.name) || "…"}`}>
          <input id="c-slug" value={v.slug} placeholder={slugify(v.name)} onChange={(e) => setV({ ...v, slug: e.target.value.toLowerCase() })} className={inputCls} />
        </Field>
        <Field label="Description" htmlFor="c-desc" className="md:col-span-2" hint="Shown under the title on the category page.">
          <textarea id="c-desc" rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Menu position" htmlFor="c-order" hint="Lower numbers appear first in the header and footer.">
          <input id="c-order" type="number" min={0} value={v.displayOrder} onChange={(e) => setV({ ...v, displayOrder: Number(e.target.value) })} className={inputCls} />
        </Field>
        <div className="flex items-end pb-2">
          <Toggle checked={v.isVisible} onChange={(x) => setV({ ...v, isVisible: x })} label="Visible in store" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">Subcategories</h3>
        <p className="text-xs text-gray-500 mb-3">Optional labels inside this category (e.g. Banarasi, Organza). Use the arrows to set their order.</p>
        {errors.subcategories && <p className="text-xs text-red-600 mb-2">{errors.subcategories}</p>}
        <ul className="border border-gray-200 rounded-md divide-y divide-gray-100">
          {subs.length === 0 && <li className="px-3 py-3 text-sm text-gray-500">No subcategories.</li>}
          {subs.map((s, i) => (
            <li key={s.key} className={cn("flex items-center gap-2 px-2 py-2", !s.isVisible && "bg-gray-50")}>
              <div className="flex flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${s.name} up`} className="p-0.5 text-gray-400 hover:text-charcoal disabled:opacity-20">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" disabled={i === subs.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${s.name} down`} className="p-0.5 text-gray-400 hover:text-charcoal disabled:opacity-20">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                aria-label="Subcategory name"
                value={s.name}
                onChange={(e) => setSubs(subs.map((x) => (x.key === s.key ? { ...x, name: e.target.value } : x)))}
                className={cn(inputCls, "flex-1 min-w-0", !s.isVisible && "text-gray-400")}
              />
              {s.productCount !== undefined && <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">{s.productCount} products</span>}
              <button
                type="button"
                onClick={() => setSubs(subs.map((x) => (x.key === s.key ? { ...x, isVisible: !x.isVisible } : x)))}
                aria-label={s.isVisible ? `Hide ${s.name}` : `Show ${s.name}`}
                title={s.isVisible ? "Visible (click to hide)" : "Hidden (click to show)"}
                className="p-1.5 text-gray-400 hover:text-charcoal"
              >
                {s.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setSubs(subs.filter((x) => x.key !== s.key))} aria-label={`Remove ${s.name}`} className="p-1.5 text-gray-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input
            aria-label="New subcategory name"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSub();
              }
            }}
            placeholder="Add a subcategory…"
            className={cn(inputCls, "flex-1")}
          />
          <button type="button" onClick={addSub} className="inline-flex items-center gap-1 px-3 border border-gray-300 rounded-md text-sm hover:border-wine">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {removed.length > 0 && (
          <p className="text-xs text-amber-700 mt-2">
            Will remove on save: {removed.map((r) => r.name).join(", ")}
            {affected > 0 && ` (${affected} product${affected === 1 ? "" : "s"} will lose this subcategory)`}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" isLoading={busy}>
        {initial.id ? "Save category" : "Create category"}
      </Button>
    </form>
  );
}

/** Category image (used on the category card). Uploaded via Cloudinary. */
export function CategoryImage({ categoryId, image }: { categoryId: string; image: string | null }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-32 bg-gray-100 rounded overflow-hidden border border-gray-200 shrink-0">
        {image ? <Image src={image} alt="" fill sizes="96px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">No image</span>}
      </div>
      <div className="space-y-2">
        <MediaUpload
          kind="categoryImage"
          label={image ? "Replace image" : "Upload image"}
          onUploaded={async (m) => {
            await api(`/api/admin/categories/${categoryId}`, { method: "PATCH", body: { image: { url: m.url, cloudinaryId: m.cloudinaryId } } });
            router.refresh();
          }}
        />
        {image && (
          <button
            type="button"
            onClick={async () => {
              try {
                await api(`/api/admin/categories/${categoryId}`, { method: "PATCH", body: { image: null } });
                router.refresh();
              } catch (error) {
                toast(errorMessage(error), "error");
              }
            }}
            className="block text-xs text-red-600 hover:underline"
          >
            Remove image
          </button>
        )}
      </div>
    </div>
  );
}
