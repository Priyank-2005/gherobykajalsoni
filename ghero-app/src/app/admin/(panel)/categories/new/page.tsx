import { Card, PageHeader } from "@/components/admin/ui";
import { CategoryEditor } from "@/components/admin/category-editor";
import { prisma } from "@/lib/db";

export const metadata = { title: "New category" };

export default async function NewCategoryPage() {
  const last = await prisma.category.aggregate({ _max: { displayOrder: true } });
  return (
    <>
      <PageHeader back={{ href: "/admin/categories", label: "Categories" }} title="New category" />
      <Card>
        <CategoryEditor
          initial={{ name: "", slug: "", description: "", displayOrder: (last._max.displayOrder ?? -1) + 1, isVisible: true, image: null, subcategories: [] }}
        />
      </Card>
    </>
  );
}
