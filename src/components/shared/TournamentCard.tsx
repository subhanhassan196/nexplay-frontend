import { Trophy, Users, Clock } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCompactNumber } from "@/lib/utils";
import type { Tournament } from "@/types";

const statusVariant = {
  upcoming: "secondary",
  live: "success",
  completed: "neutral",
} as const;

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const date = new Date(tournament.startsAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <GlassPanel hoverGlow className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <Badge variant={statusVariant[tournament.status]}>
          {tournament.status === "live" ? "● Live Now" : tournament.status}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-white">{tournament.title}</h3>
        <p className="text-sm text-muted">{tournament.game}</p>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-1.5 text-accent">
          <Trophy className="h-4 w-4" />
          <span className="font-display text-sm font-semibold">
            ${formatCompactNumber(tournament.prizePool)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Users className="h-4 w-4" />
          {tournament.participants}/{tournament.maxParticipants}
        </div>
      </div>

      <Button href={`/tournaments/${tournament.slug}`} variant="outline" size="sm" fullWidth>
        View Details
      </Button>
    </GlassPanel>
  );
}
