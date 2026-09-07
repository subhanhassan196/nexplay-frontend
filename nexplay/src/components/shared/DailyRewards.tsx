"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Coins, Gift, Lock } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

const days = [
  { day: 1, reward: "50 Coins" },
  { day: 2, reward: "75 Coins" },
  { day: 3, reward: "Badge" },
  { day: 4, reward: "100 Coins" },
  { day: 5, reward: "150 Coins" },
  { day: 6, reward: "Frame" },
  { day: 7, reward: "500 Coins" },
];

/**
 * 7-day login streak strip. `claimedThrough` simulates progress until
 * real streak tracking exists server-side.
 */
export function DailyRewards() {
  const [claimedThrough] = useState(0);

  return (
    <GlassPanel className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">
          Daily Login Rewards
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {days.map((d, i) => {
          const claimed = i < claimedThrough;
          const isToday = i === claimedThrough;
          return (
            <motion.div
              key={d.day}
              whileHover={{ y: -3 }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-3 text-center",
                claimed && "border-success/30 bg-success/5",
                isToday && "border-primary/50 bg-primary/10 shadow-glow-primary",
                !claimed && !isToday && "border-white/10 bg-white/[0.02]"
              )}
            >
              <span className="text-[10px] uppercase tracking-wide text-muted">Day {d.day}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                {claimed ? (
                  <Check className="h-4 w-4 text-success" />
                ) : isToday ? (
                  <Coins className="h-4 w-4 text-accent" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted" />
                )}
              </span>
              <span className="text-[10px] text-muted">{d.reward}</span>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
