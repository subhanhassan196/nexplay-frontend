import { Coins } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCompactNumber } from "@/lib/utils";
import type { Reward } from "@/types";

const tierVariant = {
  bronze: "accent",
  silver: "neutral",
  gold: "accent",
  platinum: "secondary",
} as const;

export function RewardCard({ reward }: { reward: Reward }) {
  return (
    <GlassPanel hoverGlow className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <Badge variant={tierVariant[reward.tier]}>{reward.tier}</Badge>
      </div>

      <div className="flex h-28 items-center justify-center rounded-xl bg-nexplay-gradient/20">
        <Coins className="h-10 w-10 text-accent" />
      </div>

      <div>
        <h3 className="font-display text-base font-semibold text-white">{reward.title}</h3>
        <p className="mt-1 text-xs text-muted">{reward.description}</p>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-accent">
          <Coins className="h-4 w-4" />
          {formatCompactNumber(reward.cost)}
        </span>
        <Button variant="outline" size="sm">
          Redeem
        </Button>
      </div>
    </GlassPanel>
  );
}
