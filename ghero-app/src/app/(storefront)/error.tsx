"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/feedback";

/** Route-level error boundary for storefront pages. */
export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState description="We couldn't load this page. Please try again." onRetry={reset} />
    </div>
  );
}
