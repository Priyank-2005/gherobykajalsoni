import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12" aria-busy="true" aria-label="Loading product">
      <SkeletonText className="w-64 h-3 mb-8 hidden md:block" />
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        <SkeletonBox className="w-full lg:w-1/2 aspect-[3/4]" />
        <div className="w-full lg:w-1/2 space-y-5">
          <SkeletonText className="w-24 h-3" />
          <SkeletonBox className="h-10 w-3/4" />
          <SkeletonBox className="h-8 w-40" />
          <SkeletonBox className="h-12 w-full" />
          <SkeletonBox className="h-12 w-2/3" />
          <SkeletonBox className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
