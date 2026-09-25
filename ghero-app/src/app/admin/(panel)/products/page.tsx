import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminListProducts } from "@/lib/services/product.service";
import { adminListCategories } from "@/lib/services/category.service";
import { SearchInput, SelectFilter } from "@/components/admin/list-controls";
import { PageHeader, Pill, TableWrap, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/ui/pagination";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [data, categories] = await Promise.all([
    adminListProducts({ q: sp.q, categoryId: sp.categoryId, page, pageSize: 20 }),
    adminListCategories(),
  ]);

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    return `/admin/products?${next}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${data.total} product${data.total === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 bg-wine text-white rounded-md px-4 py-2 text-sm hover:bg-wine/90">
            <Plus className="w-4 h-4" /> Add product
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput placeholder="Search name, SKU, fabric, category" />
        <SelectFilter param="categoryId" label="Filter by category" options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th className={th}>Product</th>
            <th className={th}>Category</th>
            <th className={`${th} text-right`}>Price</th>
            <th className={`${th} text-right`}>Stock</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.products.length === 0 && (
            <tr>
              <td colSpan={5} className={`${td} text-center text-gray-500 py-10`}>
                No products found. <Link href="/admin/products/new" className="text-wine underline">Add one</Link>
              </td>
            </tr>
          )}
          {data.products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className={td}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 group">
                  <span className="relative w-10 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium group-hover:text-wine truncate">{p.name}</span>
                    <span className="block text-xs text-gray-400">{p.variantCount} variant{p.variantCount === 1 ? "" : "s"}</span>
                  </span>
                </Link>
              </td>
              <td className={td}>
                {p.category}
                {p.subcategory && <div className="text-xs text-gray-400">{p.subcategory}</div>}
              </td>
              <td className={`${td} text-right tabular-nums`}>
                {formatPrice(p.basePrice)}
                {p.baseMrp > p.basePrice && <div className="text-xs text-gray-400 line-through">{formatPrice(p.baseMrp)}</div>}
              </td>
              <td className={`${td} text-right tabular-nums`}>
                <span className={p.totalStock === 0 ? "text-red-600" : p.totalStock <= 3 ? "text-amber-700" : ""}>{p.totalStock}</span>
              </td>
              <td className={td}>
                <div className="flex flex-wrap gap-1">
                  {p.isPublished ? <Pill tone="green">Published</Pill> : <Pill>Draft</Pill>}
                  {p.isNewArrival && <Pill tone="gold">New</Pill>}
                  {p.isBestseller && <Pill tone="gold">Bestseller</Pill>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
    </>
  );
}
