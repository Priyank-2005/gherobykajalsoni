import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminListCategories } from "@/lib/services/category.service";
import { PageHeader, Pill } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await adminListCategories();

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories appear in the header menu in this order. Subcategories are edited inside each category."
        actions={
          <Link href="/admin/categories/new" className="inline-flex items-center gap-2 bg-wine text-white rounded-md px-4 py-2 text-sm hover:bg-wine/90">
            <Plus className="w-4 h-4" /> Add category
          </Link>
        }
      />

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/categories/${c.id}`} className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-wine transition-colors h-full">
              <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                {c.image && <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{c.name}</h2>
                  {!c.isVisible && <Pill>Hidden</Pill>}
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  /{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"} · position {c.displayOrder}
                </p>
                <div className="flex flex-wrap gap-1">
                  {c.subcategories.length === 0 && <span className="text-xs text-gray-400">No subcategories</span>}
                  {c.subcategories.map((s) => (
                    <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full border ${s.isVisible ? "border-gray-200 text-gray-600" : "border-dashed border-gray-300 text-gray-400"}`}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
