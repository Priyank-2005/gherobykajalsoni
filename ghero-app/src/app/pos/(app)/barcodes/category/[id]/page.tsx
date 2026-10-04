import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requirePosPage } from "@/lib/pos-auth";
import { labelCategory } from "@/lib/services/labels.service";
import { LabelDownloadButton, LabelOptionsBar } from "@/components/pos/label-options";
import { Thumb } from "@/components/pos/scan-bar";
import { cn } from "@/lib/utils";

export const metadata = { title: "Barcodes" };

/** Barcodes, step 2: one category's subcategories and products. ?sub=<id> filters the list. */
export default async function BarcodeCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sub?: string }> }) {
  await requirePosPage("MANAGER");
  const [{ id }, { sub }] = await Promise.all([params, searchParams]);
  const category = await labelCategory(id);
  if (!category) notFound();
  const activeSub = category.subcategories.find((s) => s.id === sub) ?? null;
  const products = activeSub ? category.products.filter((p) => p.subcategoryId === activeSub.id) : category.products;

  return (
    <div className="space-y-4">
      <Link href="/pos/barcodes" className="inline-flex items-center text-sm text-gray-500 hover:text-wine">
        <ChevronLeft className="w-4 h-4" /> All categories
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl">{category.name}</h1>
        <LabelDownloadButton
          scope="category"
          id={category.id}
          pieces={category.products.reduce((s, p) => s + p.pieces, 0)}
          variants={category.products.reduce((s, p) => s + p.variants, 0)}
        />
      </div>
      <LabelOptionsBar />

      {category.subcategories.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Subcategories</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link href={`/pos/barcodes/category/${category.id}`} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", !activeSub ? "border-wine bg-wine text-white" : "border-gray-300 bg-white")}>
              All
            </Link>
            {category.subcategories.map((s) => (
              <Link key={s.id} href={`/pos/barcodes/category/${category.id}?sub=${s.id}`} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap", activeSub?.id === s.id ? "border-wine bg-wine text-white" : "border-gray-300 bg-white")}>
                {s.name} <span className="opacity-70">({s.products})</span>
              </Link>
            ))}
          </div>
          {activeSub && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-sm"><b>{activeSub.name}</b> · {activeSub.products} products · {activeSub.pieces} in stock</p>
              <LabelDownloadButton scope="subcategory" id={activeSub.id} pieces={activeSub.pieces} variants={activeSub.variants} />
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Products</h2>
        {products.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 text-center">No products here yet. Add them in Admin → Products; barcodes are created automatically.</p>
        ) : (
          <ul className="bg-white border border-gray-200 rounded-xl divide-y">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Link href={`/pos/barcodes/product/${p.id}`} className="flex flex-1 min-w-0 items-center gap-3 group">
                  <Thumb src={p.imageUrl} alt={p.name} size={44} />
                  <span className="min-w-0">
                    <span className="block font-medium truncate group-hover:text-wine">{p.name}</span>
                    <span className="block text-xs text-gray-500">{p.variants} size{p.variants === 1 ? "" : "s"} · {p.pieces} in stock{p.isPublished ? "" : " · draft"}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto shrink-0" />
                </Link>
                <LabelDownloadButton scope="product" id={p.id} pieces={p.pieces} variants={p.variants} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
