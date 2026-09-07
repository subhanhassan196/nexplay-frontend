"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { formatCompactNumber } from "@/lib/utils";

interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
}

/**
 * Animates a number from 0 to `value` once it scrolls into view.
 * Used in the Statistics section on the home page.
 */
export function StatCounter({ value, suffix = "", label }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <span className="font-display text-4xl font-bold text-white sm:text-5xl">
        {suffix === "$" ? "$" : ""}
        {formatCompactNumber(display)}
        {suffix !== "$" ? suffix : ""}
      </span>
      <span className="text-sm uppercase tracking-wide text-muted">{label}</span>
    </motion.div>
  );
}
