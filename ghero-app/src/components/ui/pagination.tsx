import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page window around the current page, with ellipses: 1 … 4 5 6 … 12 */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

/** Link-based pagination: each page is a real URL (shareable, crawlable, back-button friendly). */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const base = "min-w-10 h-10 px-3 inline-flex items-center justify-center text-sm border transition-colors";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(base, "border-gray-200 hover:border-wine")} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className={cn(base, "border-gray-100 text-gray-300")} aria-hidden>
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(base, p === page ? "border-wine bg-wine text-white" : "border-gray-200 hover:border-wine")}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(base, "border-gray-200 hover:border-wine")} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className={cn(base, "border-gray-100 text-gray-300")} aria-hidden>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
