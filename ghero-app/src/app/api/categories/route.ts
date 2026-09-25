import { handle, ok } from "@/lib/api";
import { listCategories } from "@/lib/services/category.service";

/** Visible categories, each with its visible subcategories. */
export const GET = handle(async () => ok({ categories: await listCategories() }));
