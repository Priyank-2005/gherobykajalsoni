import { notFound } from "next/navigation";
import { adminListCategories } from "@/lib/services/category.service";
import { Card, PageHeader } from "@/components/admin/ui";
import { CategoryEditor, CategoryImage } from "@/components/admin/category-editor";
import { DeleteCategory } from "./delete-category";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = (await adminListCategories()).find((c) => c.id === id);
  if (!category) notFound();

  return (
    <>
      <PageHeader back={{ href: "/admin/categories", label: "Categories" }} title={category.name} description={`${category.productCount} products`} />
      <div className="space-y-6">
        <Card title="Details & subcategories">
          <CategoryEditor
            initial={{
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description ?? "",
              displayOrder: category.displayOrder,
              isVisible: category.isVisible,
              image: category.image,
              subcategories: category.subcategories.map((s) => ({ id: s.id, name: s.name, slug: s.slug, isVisible: s.isVisible, productCount: s.productCount })),
            }}
          />
        </Card>
        <Card title="Image">
          <CategoryImage categoryId={category.id} image={category.image} />
        </Card>
        <Card title="Danger zone" className="border-red-200">
          <DeleteCategory categoryId={category.id} name={category.name} productCount={category.productCount} />
        </Card>
      </div>
    </>
  );
}
