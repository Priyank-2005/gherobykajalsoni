import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/feedback";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <EmptyState
        icon={<SearchX className="w-14 h-14" strokeWidth={1.25} />}
        title="We couldn't find that page"
        description="It may have moved, or the product is no longer available."
        action={
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/shop" className="px-6 py-3 bg-wine text-white hover:bg-wine/90 transition-colors text-sm">
              Browse the collection
            </Link>
            <Link href="/" className="px-6 py-3 border border-wine text-wine hover:bg-wine/5 transition-colors text-sm">
              Go home
            </Link>
          </div>
        }
      />
    </div>
  );
}
