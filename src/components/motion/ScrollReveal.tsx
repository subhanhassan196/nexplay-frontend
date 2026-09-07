"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

const variants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Standard scroll-triggered reveal used across section content
 * (cards, headings, stat blocks) for a consistent AAA feel.
 */
export function ScrollReveal({ children, delay = 0, className, once = true }: ScrollRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — wrap a list of ScrollReveal/StaggerItem children
 * to have them animate in sequence as the section scrolls into view.
 */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: 0.08 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={variants} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}
