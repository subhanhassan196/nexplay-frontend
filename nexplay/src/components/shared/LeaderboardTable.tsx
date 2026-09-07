import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatCompactNumber, cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const trendIcon = {
  up: <TrendingUp className="h-4 w-4 text-success" />,
  down: <TrendingDown className="h-4 w-4 text-danger" />,
  same: <Minus className="h-4 w-4 text-muted" />,
};

const rankStyles = (rank: number) => {
  if (rank === 1) return "text-accent";
  if (rank === 2) return "text-white/80";
  if (rank === 3) return "text-primary";
  return "text-muted";
};

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-center gap-4 border-b border-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="w-8">#</span>
        <span className="flex-1">Player</span>
        <span className="w-20 text-right">Score</span>
        <span className="w-10 text-right">Trend</span>
      </div>
      {entries.map((entry) => (
        <div
          key={entry.playerId}
          className="flex items-center gap-4 border-b border-white/5 px-5 py-3 transition-colors hover:bg-white/[0.03] last:border-b-0"
        >
          <span className={cn("w-8 font-display text-lg font-bold", rankStyles(entry.rank))}>
            {entry.rank}
          </span>
          <div className="flex flex-1 items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-nexplay-gradient" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{entry.username}</span>
              {entry.country && (
                <span className="text-xs text-muted">{entry.country}</span>
              )}
            </div>
          </div>
          <span className="w-20 text-right font-display text-sm font-semibold text-white">
            {formatCompactNumber(entry.score)}
          </span>
          <span className="flex w-10 justify-end">
            {entry.trend ? trendIcon[entry.trend] : null}
          </span>
        </div>
      ))}
    </GlassPanel>
  );
}
