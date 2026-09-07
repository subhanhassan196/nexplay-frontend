"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper used across the homepage sections.
 *
 * Animates only `transform` and `opacity`, fires once, and starts
 * slightly before the element is fully in view so content is already
 * settled by the time the reader reaches it. Respects
 * `prefers-reduced-motion` by rendering the final state immediately.
 */
interface RevealProps {
  children: ReactNode;
  /** Stagger position when several Reveals sit in a row. */
  index?: number;
  /** Direction the content travels from. */
  from?: "bottom" | "left" | "right";
  className?: string;
}

const OFFSET = 24;

export function Reveal({ children, index = 0, from = "bottom", className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  const hidden = reduceMotion
    ? { opacity: 1 }
    : {
        opacity: 0,
        y: from === "bottom" ? OFFSET : 0,
        x: from === "left" ? -OFFSET : from === "right" ? OFFSET : 0,
      };

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: reduceMotion ? 0 : Math.min(index * 0.07, 0.35),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
