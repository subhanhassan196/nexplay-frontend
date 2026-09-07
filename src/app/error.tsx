"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/StateScreens";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Phase 2: send to error monitoring (Sentry/Datadog)
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ErrorState
        title="Something broke on our end"
        description="Our team has been notified. Try again, or head back to the homepage."
        actionLabel="Try Again"
        onRetry={reset}
        className="max-w-md"
      />
    </div>
  );
}
