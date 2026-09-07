"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatCompactNumber } from "@/lib/utils";

/**
 * Ambient "live players online" ticker. Number is a display-only
 * client-side simulation until the real presence service (Socket.IO)
 * exists in a later phase.
 */
export function LivePlayersCounter() {
  const [count, setCount] = useState(214830);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 9 - 3));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-8">
      <div className="container-nexplay">
        <GlassPanel className="flex flex-wrap items-center justify-center gap-3 px-6 py-4 text-center">
          <span className="relative flex h-2.5 w-2.5">
            <Circle className="absolute h-2.5 w-2.5 animate-ping fill-success text-success opacity-75" />
            <Circle className="relative h-2.5 w-2.5 fill-success text-success" />
          </span>
          <span className="text-sm text-muted">Live players online right now:</span>
          <motion.span
            key={count}
            initial={{ opacity: 0.4, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-lg font-bold text-white"
          >
            {formatCompactNumber(count)}
          </motion.span>
        </GlassPanel>
      </div>
    </section>
  );
}
