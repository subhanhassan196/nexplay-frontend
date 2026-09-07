import { cn } from "@/lib/utils";

/**
 * Base skeleton block. Compose into skeleton screens for cards, tables,
 * and lists so loading states never show layout shift.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-surface-light via-white/10 to-surface-light bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="glass-panel flex flex-col gap-3 p-3">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-white/5 py-3">
      <Skeleton className="h-6 w-6 rounded-md" />
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
