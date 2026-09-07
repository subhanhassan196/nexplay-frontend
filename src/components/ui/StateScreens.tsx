import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface StateScreenProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/**
 * Generic "nothing here" state — used for empty search results,
 * empty leaderboards, empty rewards inventory, etc.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: StateScreenProps) {
  return (
    <div
      className={cn(
        "glass-panel flex flex-col items-center gap-4 px-8 py-16 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-muted">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {actionLabel && actionHref && (
        <Button href={actionHref} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Generic error state — used for failed data fetches, route error
 * boundaries, and 500-style fallbacks.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We hit an unexpected error. Please try again.",
  actionLabel = "Retry",
  actionHref,
  onRetry,
  className,
}: StateScreenProps & { onRetry?: () => void }) {
  return (
    <div
      className={cn(
        "glass-panel flex flex-col items-center gap-4 border-danger/20 px-8 py-16 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <p className="max-w-sm text-sm text-muted">{description}</p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" size="sm">
          {actionLabel}
        </Button>
      ) : actionHref ? (
        <Button href={actionHref} variant="outline" size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
