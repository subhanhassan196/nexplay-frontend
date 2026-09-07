"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Wraps a card with a subtle 3D tilt + glare-following-cursor effect.
 * Used for GameCard, TournamentCard, and other showcase surfaces
 * where a console-UI "physical" feel is desired.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const glareX = useTransform(springY, [-maxTilt, maxTilt], [0, 100]);
  const glareY = useTransform(springX, [maxTilt, -maxTilt], [0, 100]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * maxTilt * 2);
    rotateX.set(-py * maxTilt * 2);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      className={cn("relative", className)}
    >
      {children}
      <motion.div
        aria-hidden
        style={{
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.12), transparent 60%)`,
        }}
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
      />
    </motion.div>
  );
}
