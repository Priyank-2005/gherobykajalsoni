import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { prisma } from "@/lib/db";
import { badRequest } from "@/lib/api";
import { toNumber } from "@/lib/money";
import { code128Bars, code128Modules } from "@/lib/barcode";

/**
 * Price-tag labels as an A4 PDF. One label per piece (or per size/colour); each shows the
 * product name, size/colour, price (and MRP when higher) and the variant's Code 128 barcode.
 *
 * Layout = the standard "65 labels per A4 sheet" grid (38.1 x 21.2 mm, 5 x 13), the most tags
 * that still scan reliably with a phone camera. It prints on plain paper (cut along the light
 * guide lines) and lines up with ready-made 65-up sticker sheets. Print at 100% / "Actual size".
 */

const MM = 72 / 25.4; // PDF points per millimetre
const A4 = { w: 210 * MM, h: 297 * MM };

export const LABEL_SHEET = {
  name: "A4 · 65 labels (38.1 × 21.2 mm)",
  perSheet: 65,
  cols: 5,
  rows: 13,
  labelW: 38.1,
  labelH: 21.2,
  left: 4.75, // page margin, mm
  top: 10.7,
  pitchX: 40.6, // label width + gap
  pitchY: 21.2,
} as const;

const PAD = 1.4; // mm inside each label
const MAX_MODULE = 0.33; // mm; wider bars scan more easily but must fit the label
const QUIET = 10; // modules of blank space each side of the bars (scanners need it)

export type LabelItem = {
  barcode: string;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  mrp: number;
};

/** pdf-lib's standard fonts only cover Latin-1; drop anything else (e.g. emoji, Devanagari). */
function latin1(text: string) {
  return text.replace(/₹/g, "Rs.").replace(/[^\x20-\x7e\xa0-\xff]/g, "").replace(/\s+/g, " ").trim();
}

const rupees = (n: number) => `Rs.${Math.round(n).toLocaleString("en-IN")}`;

/** Shorten `text` with an ellipsis until it fits `maxWidth` points. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}...`;
}

function drawLabel(page: PDFPage, item: LabelItem, x0: number, yTop: number, fonts: { regular: PDFFont; bold: PDFFont }, guides: boolean) {
  const w = LABEL_SHEET.labelW * MM;
  const h = LABEL_SHEET.labelH * MM;
  const pad = PAD * MM;
  const inner = w - pad * 2;
  const ink = rgb(0, 0, 0);
  const grey = rgb(0.35, 0.35, 0.35);

  if (guides) {
    page.drawRectangle({ x: x0, y: yTop - h, width: w, height: h, borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.3, borderDashArray: [2, 2] });
  }

  // Row 1: product name, MRP (struck through) on the right when it's higher than the price.
  const showMrp = item.mrp > item.price;
  const mrpText = showMrp ? `MRP ${rupees(item.mrp)}` : "";
  const mrpSize = 4.6;
  const mrpW = showMrp ? fonts.regular.widthOfTextAtSize(mrpText, mrpSize) : 0;
  const nameSize = 6;
  const row1 = yTop - pad - 4.4;
  page.drawText(fit(latin1(item.name), fonts.bold, nameSize, inner - mrpW - (showMrp ? 3 : 0)), { x: x0 + pad, y: row1, size: nameSize, font: fonts.bold, color: ink });
  if (showMrp) {
    const mx = x0 + w - pad - mrpW;
    page.drawText(mrpText, { x: mx, y: row1, size: mrpSize, font: fonts.regular, color: grey });
    const strikeFrom = mx + fonts.regular.widthOfTextAtSize("MRP ", mrpSize); // strike the amount only
    page.drawLine({ start: { x: strikeFrom, y: row1 + 1.7 }, end: { x: mx + mrpW, y: row1 + 1.7 }, thickness: 0.4, color: grey });
  }

  // Row 2: size · colour, selling price.
  const priceText = rupees(item.price);
  const priceSize = 7.5;
  const priceW = fonts.bold.widthOfTextAtSize(priceText, priceSize);
  const row2 = row1 - 8;
  const variantText = latin1([item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")) || " ";
  page.drawText(fit(variantText, fonts.regular, 5.4, inner - priceW - 3), { x: x0 + pad, y: row2, size: 5.4, font: fonts.regular, color: ink });
  page.drawText(priceText, { x: x0 + w - pad - priceW, y: row2 - 0.3, size: priceSize, font: fonts.bold, color: ink });

  // Barcode, centred, as vector bars (sharp on any printer).
  const modules = code128Modules(item.barcode);
  const moduleMm = Math.min(MAX_MODULE, (LABEL_SHEET.labelW - PAD * 2) / (modules + QUIET * 2));
  const unit = moduleMm * MM;
  const barsW = modules * unit;
  const bx = x0 + (w - barsW) / 2;
  const barTop = row2 - 2.6;
  const barH = 9.5 * MM;
  for (const [x, bw] of code128Bars(item.barcode)) {
    page.drawRectangle({ x: bx + x * unit, y: barTop - barH, width: bw * unit, height: barH, color: ink });
  }

  // Row 3: the number (typed in if the bars get damaged), brand on the left.
  const codeSize = 5.6;
  const codeW = fonts.regular.widthOfTextAtSize(item.barcode, codeSize);
  const row3 = barTop - barH - 6;
  page.drawText(item.barcode, { x: x0 + (w - codeW) / 2, y: row3, size: codeSize, font: fonts.regular, color: ink });
  page.drawText("GHERO", { x: x0 + pad, y: row3, size: 4.2, font: fonts.bold, color: grey });
}

/**
 * Build the PDF. `startAt` (1-based) skips used positions on a partly used sticker sheet.
 * `guides` draws light cut lines around each label (for plain paper).
 */
export async function buildLabelsPdf(items: LabelItem[], options: { startAt?: number; guides?: boolean; title?: string } = {}) {
  if (!items.length) throw badRequest("There are no labels to print. Check that the items have stock, or choose one label per size.");
  if (items.length > 5000) throw badRequest("That's more than 5,000 labels. Please print a smaller selection.");
  const startAt = Math.min(Math.max(1, Math.floor(options.startAt ?? 1)), LABEL_SHEET.perSheet);
  const guides = options.guides ?? true;

  const doc = await PDFDocument.create();
  doc.setTitle(options.title ?? "Ghero price labels");
  doc.setCreator("Ghero POS");
  const fonts = { regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };

  let page: PDFPage | null = null;
  let slot = startAt - 1;
  for (const item of items) {
    if (!page || slot >= LABEL_SHEET.perSheet) {
      if (page) slot = 0; // later sheets start at the first position
      page = doc.addPage([A4.w, A4.h]);
    }
    const col = slot % LABEL_SHEET.cols;
    const row = Math.floor(slot / LABEL_SHEET.cols);
    const x = (LABEL_SHEET.left + col * LABEL_SHEET.pitchX) * MM;
    const yTop = A4.h - (LABEL_SHEET.top + row * LABEL_SHEET.pitchY) * MM;
    drawLabel(page, item, x, yTop, fonts, guides);
    slot++;
  }
  return doc.save();
}

/** A one-page alignment test: an outline of every label position, numbered. */
export async function buildTestSheetPdf() {
  const doc = await PDFDocument.create();
  doc.setTitle("Ghero label test sheet");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([A4.w, A4.h]);
  for (let i = 0; i < LABEL_SHEET.perSheet; i++) {
    const col = i % LABEL_SHEET.cols;
    const row = Math.floor(i / LABEL_SHEET.cols);
    const x = (LABEL_SHEET.left + col * LABEL_SHEET.pitchX) * MM;
    const yTop = A4.h - (LABEL_SHEET.top + row * LABEL_SHEET.pitchY) * MM;
    page.drawRectangle({ x, y: yTop - LABEL_SHEET.labelH * MM, width: LABEL_SHEET.labelW * MM, height: LABEL_SHEET.labelH * MM, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
    page.drawText(String(i + 1), { x: x + 4, y: yTop - 12, size: 9, font });
  }
  page.drawText("Print at 100% (Actual size). Each box should match one label on the sticker sheet.", { x: 14, y: 12, size: 7, font, color: rgb(0.3, 0.3, 0.3) });
  return doc.save();
}

// ---------------------------------------------------------------------------
// Choosing what to print
// ---------------------------------------------------------------------------

/** "stock" = one label per piece in stock; "one" = one label per size/colour. */
export type LabelMode = "stock" | "one";

const variantSelect = {
  id: true,
  barcode: true,
  size: true,
  color: true,
  price: true,
  mrp: true,
  stock: true,
  product: { select: { name: true } },
} as const;

type VariantRow = { id: string; barcode: string; size: string | null; color: string | null; price: unknown; mrp: unknown; stock: number; product: { name: string } };

function toItem(v: VariantRow): LabelItem {
  return { barcode: v.barcode, name: v.product.name, size: v.size, color: v.color, price: toNumber(v.price as never), mrp: toNumber(v.mrp as never) };
}

function expand(variants: VariantRow[], mode: LabelMode) {
  return variants.flatMap((v) => Array.from({ length: mode === "one" ? 1 : Math.max(0, v.stock) }, () => toItem(v)));
}

/** Labels for a whole category, a subcategory or one product, in catalogue order. */
export async function labelsForScope(scope: "category" | "subcategory" | "product", id: string, mode: LabelMode) {
  const where =
    scope === "category" ? { product: { categoryId: id } } : scope === "subcategory" ? { product: { subcategoryId: id } } : { productId: id };
  const variants = await prisma.productVariant.findMany({
    where,
    orderBy: [{ product: { name: "asc" } }, { createdAt: "asc" }],
    select: variantSelect,
  });
  return expand(variants, mode);
}

/** Labels for an explicit list, e.g. stock just received, or custom quantities per size. */
export async function labelsForItems(lines: { variantId: string; quantity: number }[]) {
  const variants = await prisma.productVariant.findMany({ where: { id: { in: lines.map((l) => l.variantId) } }, select: variantSelect });
  const byId = new Map(variants.map((v) => [v.id, v]));
  return lines.flatMap((l) => {
    const v = byId.get(l.variantId);
    return v ? Array.from({ length: Math.max(0, Math.floor(l.quantity)) }, () => toItem(v)) : [];
  });
}

// ---------------------------------------------------------------------------
// Browsing for the Barcodes page (category → subcategory → product)
// ---------------------------------------------------------------------------

/** Every category with product / size / piece counts. */
export async function labelCategories() {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, name: true, _count: { select: { products: true } } } }),
    prisma.$queryRaw<{ categoryId: string; variants: number; pieces: number }[]>`
      SELECT p."categoryId", COUNT(v.id)::int AS variants, COALESCE(SUM(GREATEST(v.stock, 0)), 0)::int AS pieces
      FROM "Product" p JOIN "ProductVariant" v ON v."productId" = p.id GROUP BY p."categoryId"`,
  ]);
  const byId = new Map(counts.map((c) => [c.categoryId, c]));
  return categories.map((c) => ({ id: c.id, name: c.name, products: c._count.products, variants: byId.get(c.id)?.variants ?? 0, pieces: byId.get(c.id)?.pieces ?? 0 }));
}

/** One category: its subcategories and products, each with size / piece counts. */
export async function labelCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      subcategories: { orderBy: { displayOrder: "asc" }, select: { id: true, name: true } },
      products: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          subcategoryId: true,
          isPublished: true,
          images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } },
          variants: { select: { stock: true } },
        },
      },
    },
  });
  if (!category) return null;
  const products = category.products.map((p) => ({
    id: p.id,
    name: p.name,
    subcategoryId: p.subcategoryId,
    isPublished: p.isPublished,
    imageUrl: p.images[0]?.url ?? null,
    variants: p.variants.length,
    pieces: p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0),
  }));
  const subcategories = category.subcategories.map((s) => {
    const mine = products.filter((p) => p.subcategoryId === s.id);
    return { ...s, products: mine.length, variants: mine.reduce((n, p) => n + p.variants, 0), pieces: mine.reduce((n, p) => n + p.pieces, 0) };
  });
  return { id: category.id, name: category.name, subcategories, products };
}

/** One product's sizes / colours with their barcodes, for custom label quantities. */
export async function labelProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
      subcategory: { select: { name: true } },
      variants: { orderBy: { createdAt: "asc" }, select: { id: true, barcode: true, sku: true, size: true, color: true, price: true, mrp: true, stock: true } },
    },
  });
  if (!product) return null;
  return { ...product, variants: product.variants.map((v) => ({ ...v, price: toNumber(v.price), mrp: toNumber(v.mrp) })) };
}
