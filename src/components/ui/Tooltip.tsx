"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "glass pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-white shadow-glass",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
