import { adminListCategories } from "@/lib/services/category.service";
import { Card, PageHeader } from "@/components/admin/ui";
import { ProductForm, emptyProduct } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await adminListCategories();
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Add the details first; variants, images and videos come next." />
      <Card>
        <ProductForm
          initial={emptyProduct}
          categories={categories.map((c) => ({ id: c.id, name: c.name, subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })) }))}
        />
      </Card>
    </>
  );
}
