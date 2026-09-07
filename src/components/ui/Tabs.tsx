"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

/**
 * Reusable tabs primitive with animated active-pill indicator.
 * Used on Leaderboard (rank ranges), Community (feed filters),
 * and Game Details (Overview / Reviews / Stats).
 */
export function Tabs({
  items,
  defaultValue,
  className,
}: {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);
  const activeContent = items.find((i) => i.value === active)?.content;

  return (
    <div className={className}>
      <div role="tablist" className="glass mb-6 inline-flex gap-1 rounded-xl p-1">
        {items.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={active === item.value}
            onClick={() => setActive(item.value)}
            className={cn(
              "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active === item.value ? "text-white" : "text-muted hover:text-white"
            )}
          >
            {active === item.value && (
              <motion.span
                layoutId="tabs-active-pill"
                className="absolute inset-0 rounded-lg bg-nexplay-gradient"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeContent}</div>
    </div>
  );
}
