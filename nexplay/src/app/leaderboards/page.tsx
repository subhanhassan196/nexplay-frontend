"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Trophy, Minus, TrendingUp, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/StateScreens";
import { leaderboardApi, type LeaderboardEntryDTO } from "@/lib/api/platform";
import { useAuth } from "@/context/AuthContext";
import { formatCompactNumber, cn } from "@/lib/utils";

type Board = "global" | "weekly" | "friends";

const TABS: { id: Board; label: string; authOnly?: boolean }[] = [
  { id: "global", label: "Global" },
  { id: "weekly", label: "This Week" },
  { id: "friends", label: "Friends", authOnly: true },
];

/**
 * Leaderboards read from real recorded play — total score per user for
 * the global board, XP earned in the last 7 days for the weekly board.
 * When nobody has played yet the board is genuinely empty rather than
 * padded with invented players.
 */
export default function LeaderboardsPage() {
  const { isAuthenticated } = useAuth();
  const [board, setBoard] = useState<Board>("global");
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res =
        board === "weekly"
          ? await leaderboardApi.weekly()
          : board === "friends"
            ? await leaderboardApi.friends()
            : await leaderboardApi.global();
      setEntries(res.data.data.entries);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [board]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTabs = TABS.filter((t) => !t.authOnly || isAuthenticated);

  return (
    <div className="container-nexplay section-padding pt-32">
      <SectionHeading
        eyebrow="Compete"
        title="Leader"
        highlight="boards"
        description="Rankings built from real matches played across NexPlay."
        className="mb-8"
      />

      <div className="mb-6 inline-flex rounded-2xl border border-white/10 p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBoard(tab.id)}
            aria-pressed={board === tab.id}
            className={cn(
              "rounded-xl px-5 py-2.5 text-sm font-medium transition-colors",
              board === tab.id ? "bg-nexplay-gradient text-white" : "text-muted hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No rankings yet"
          description={
            board === "friends"
              ? "Add friends and play a few matches to see how you compare."
              : "Once players start competing, the leaderboard will fill up here."
          }
        />
      ) : (
        <GlassPanel className="overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_auto_auto] gap-4 border-b border-white/10 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="hidden text-right sm:block">Wins</span>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.userId}
              className="grid grid-cols-[48px_1fr_auto_auto] items-center gap-4 border-b border-white/5 px-5 py-3.5 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <span
                className={cn(
                  "font-display text-lg font-bold",
                  entry.rank === 1 && "text-accent",
                  entry.rank === 2 && "text-white/80",
                  entry.rank === 3 && "text-primary",
                  entry.rank > 3 && "text-muted"
                )}
              >
                {entry.rank}
              </span>

              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30">
                  {entry.avatarUrl ? (
                    <Image src={entry.avatarUrl} alt={`${entry.username} avatar`} fill sizes="36px" className="object-cover" />
                  ) : (
                    <span className="m-auto text-xs font-semibold text-white">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{entry.username}</p>
                  {entry.gamesPlayed > 0 && (
                    <p className="text-xs text-muted">{entry.gamesPlayed} matches</p>
                  )}
                </div>
              </div>

              <span className="text-right font-medium text-white">{formatCompactNumber(entry.score)}</span>
              <span className="hidden text-right text-sm text-muted sm:block">{entry.wins}</span>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
