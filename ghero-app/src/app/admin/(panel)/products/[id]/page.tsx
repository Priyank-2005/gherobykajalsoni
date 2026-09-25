import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AppError } from "@/lib/api";
import { toNumber } from "@/lib/money";
import { adminGetProduct } from "@/lib/services/product.service";
import { adminListCategories } from "@/lib/services/category.service";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { VariantsEditor } from "@/components/admin/variants-editor";
import { ProductMedia } from "@/components/admin/product-media";
import { DeleteProduct } from "./delete-product";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    adminGetProduct(id).catch((e) => {
      if (e instanceof AppError && e.status === 404) notFound();
      throw e;
    }),
    adminListCategories(),
  ]);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={product.name}
        description={
          <span className="inline-flex flex-wrap gap-1.5 items-center">
            {product.isPublished ? <Pill tone="green">Published</Pill> : <Pill>Draft (hidden from store)</Pill>}
            <span>{product.variants.length} variants · {totalStock} in stock</span>
          </span>
        }
        actions={
          product.isPublished ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex items-center gap-2 border border-gray-300 bg-white rounded-md px-3 py-2 text-sm hover:border-wine">
              <ExternalLink className="w-4 h-4" /> View in store
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <Card title="Details">
          <ProductForm
            productId={product.id}
            categories={categories.map((c) => ({ id: c.id, name: c.name, subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })) }))}
            initial={{
              name: product.name,
              slug: product.slug,
              categoryId: product.categoryId,
              subcategoryId: product.subcategoryId ?? "",
              basePrice: String(toNumber(product.basePrice)),
              baseMrp: String(toNumber(product.baseMrp)),
              description: product.description ?? "",
              fabric: product.fabric ?? "",
              careInstructions: product.careInstructions ?? "",
              sizeGuide: product.sizeGuide ?? "",
              isPublished: product.isPublished,
              isNewArrival: product.isNewArrival,
              isBestseller: product.isBestseller,
            }}
          />
        </Card>

        <Card title="Variants, pricing & stock">
          <VariantsEditor
            productId={product.id}
            defaults={{ price: toNumber(product.basePrice), mrp: toNumber(product.baseMrp) }}
            variants={product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex,
              price: toNumber(v.price),
              mrp: toNumber(v.mrp),
              stock: v.stock,
              isAvailable: v.isAvailable,
            }))}
          />
        </Card>

        <Card title="Images & videos">
          <ProductMedia
            productId={product.id}
            productName={product.name}
            images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
            videos={product.videos.map((v) => ({ id: v.id, url: v.url, thumbnail: v.thumbnail }))}
          />
        </Card>

        <Card title="Danger zone" className="border-red-200">
          <DeleteProduct productId={product.id} name={product.name} isPublished={product.isPublished} />
        </Card>
      </div>
    </>
  );
}
