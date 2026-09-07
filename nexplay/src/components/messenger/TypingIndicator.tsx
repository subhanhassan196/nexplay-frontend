"use client";

import { motion } from "framer-motion";
import { Headset } from "lucide-react";

export function TypingIndicator({ label = "Support" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
        <Headset className="h-3.5 w-3.5" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.05] px-3 py-2.5">
        <span className="sr-only">{label} is typing</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
