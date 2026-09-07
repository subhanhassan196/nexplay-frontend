"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { leaderboardApi, type LeaderboardEntryDTO } from "@/lib/api/platform";
import { formatCompactNumber, cn } from "@/lib/utils";

/**
 * Homepage leaderboard teaser. Shows the real top five; if nobody has
 * played yet the section hides itself rather than displaying invented
 * players.
 */
export function LeaderboardPreview() {
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    leaderboardApi
      .global()
      .then(({ data }) => {
        if (!cancelled) setEntries(data.data.entries.slice(0, 5));
      })
      .catch(() => setEntries([]))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && entries.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-nexplay flex flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Compete"
            title="Top"
            highlight="Players"
            description="The highest-scoring players across NexPlay right now."
          />
          <Button href="/leaderboards" variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
            Full Leaderboard
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <GlassPanel className="divide-y divide-white/5 overflow-hidden">
            {entries.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-4 px-5 py-3.5">
                <span
                  className={cn(
                    "w-6 font-display text-lg font-bold",
                    entry.rank === 1 && "text-accent",
                    entry.rank === 2 && "text-white/80",
                    entry.rank === 3 && "text-primary",
                    entry.rank > 3 && "text-muted"
                  )}
                >
                  {entry.rank}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexplay-gradient/30 text-xs font-semibold text-white">
                  {entry.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-white">{entry.username}</span>
                <span className="font-medium text-white">{formatCompactNumber(entry.score)}</span>
              </div>
            ))}
          </GlassPanel>
        )}
      </div>
    </section>
  );
}
