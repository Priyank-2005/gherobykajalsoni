import { SkeletonBox, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

/** Route-level loading UI for listing pages (shop, category, search). */
export function ListingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12" aria-busy="true" aria-label="Loading products">
      <SkeletonText className="w-40 h-3 mb-8" />
      <SkeletonBox className="h-12 w-72 mb-4" />
      <SkeletonText className="w-full max-w-xl mb-10" />
      <div className="flex gap-8">
        <div className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-6">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonBox key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
