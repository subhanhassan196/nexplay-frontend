import { Radio, Users } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatCompactNumber } from "@/lib/utils";
import type { Streamer } from "@/types";

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  return (
    <GlassPanel hoverGlow className="flex flex-col gap-4 p-5">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/30 via-surface to-secondary/20">
        <Avatar name={streamer.name} size="xl" />
        {streamer.isLive && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <Radio className="h-2.5 w-2.5" /> Live
          </span>
        )}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <Users className="h-2.5 w-2.5" />
          {formatCompactNumber(streamer.viewers)}
        </span>
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-white">{streamer.name}</p>
        <p className="text-xs text-muted">{streamer.handle}</p>
      </div>
      <Badge variant="neutral" className="w-fit">
        {streamer.game}
      </Badge>
    </GlassPanel>
  );
}
