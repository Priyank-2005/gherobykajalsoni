import type { ZodType } from "zod";
import { notFound } from "@/lib/api";
import {
  heroAdmin,
  homepageCategoryAdmin,
  reelAdmin,
  testimonialAdmin,
} from "@/lib/services/homepage.service";
import {
  heroSchema,
  homepageCategorySchema,
  reelSchema,
  testimonialSchema,
} from "@/lib/validations/homepage";

type SectionAdmin = {
  list(): Promise<unknown[]>;
  create(data: never): Promise<unknown>;
  update(id: string, data: never): Promise<unknown>;
  remove(id: string): Promise<string[]>;
};

// Each section pairs its CRUD service with the schema its payloads must pass.
// The route validates with `schema`/`updateSchema` before calling admin.create/update.
const SECTIONS: Record<string, { admin: SectionAdmin; schema: ZodType<unknown>; updateSchema: ZodType<unknown> }> = {
  hero: { admin: heroAdmin, schema: heroSchema, updateSchema: heroSchema.partial() },
  categories: { admin: homepageCategoryAdmin, schema: homepageCategorySchema, updateSchema: homepageCategorySchema.partial() },
  reels: { admin: reelAdmin, schema: reelSchema, updateSchema: reelSchema.partial() },
  testimonials: { admin: testimonialAdmin, schema: testimonialSchema, updateSchema: testimonialSchema.partial() },
};

export function resolveSection(section: string) {
  const entry = Object.hasOwn(SECTIONS, section) ? SECTIONS[section] : undefined;
  if (!entry) throw notFound("Unknown homepage section");
  return entry;
}
