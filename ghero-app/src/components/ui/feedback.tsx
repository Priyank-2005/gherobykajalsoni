import React from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Star, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline loading spinner. */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 className={cn("w-5 h-5 animate-spin text-wine", className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Home / Shop / ... trail. Last item is the current page (not a link). */
export function Breadcrumb({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-gray-500 mb-6", className)}>
      <ol className="flex flex-wrap items-center gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center min-w-0">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-wine truncate">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate max-w-[16rem]", last && "text-charcoal font-medium")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="w-3.5 h-3.5 mx-1.5 shrink-0" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Star rating (read-only). */
export function Rating({ value, max = 5, className }: { value: number; max?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`Rated ${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} className={cn("w-4 h-4", i < value ? "fill-gold text-gold" : "text-gold/30")} aria-hidden />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-16 px-4 flex flex-col items-center", className)}>
      {icon && <div className="text-wine/70 mb-5">{icon}</div>}
      <h3 className="text-2xl font-heading text-charcoal mb-3">{title}</h3>
      {description && <p className="text-gray-500 mb-8 max-w-md">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("text-center py-16 px-4 flex flex-col items-center", className)}>
      <AlertTriangle className="w-10 h-10 text-wine/70 mb-4" aria-hidden />
      <h3 className="text-2xl font-heading text-charcoal mb-3">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-3 bg-wine text-white hover:bg-wine/90 transition-colors text-sm">
          Try again
        </button>
      )}
    </div>
  );
}
