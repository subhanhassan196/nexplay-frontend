"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Users, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Magnetic } from "@/components/motion/Magnetic";
import { api } from "@/lib/api/axios";
import { formatCompactNumber } from "@/lib/utils";

interface PlatformStats {
  players: number;
  games: number;
  tournaments: number;
}

/**
 * Hero composition.
 *
 * Depth comes from four stacked layers rather than heavy effects: an
 * aurora gradient, a masked grid, two slow-drifting light blooms, and the
 * content itself on a subtle parallax. Everything animates on `transform`
 * and `opacity` only, so nothing triggers layout work while scrolling.
 *
 * The stat pills show real platform counts — they used to be invented
 * numbers, which is exactly the kind of thing that makes a product feel
 * like a mockup.
 */
export function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  // Content drifts up slightly slower than the page — enough to read as
  // depth, small enough that it never feels like the page is lagging.
  const contentY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : 80]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, reduceMotion ? 1 : 0.4]);

  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: PlatformStats }>("/games/stats")
      .then(({ data }) => !cancelled && setStats(data.data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const pills = [
    { icon: Users, value: stats?.players, label: "Players" },
    { icon: Gamepad2, value: stats?.games, label: "Games" },
    { icon: Trophy, value: stats?.tournaments, label: "Tournaments" },
  ];

  // One shared reveal so the hero reads as a single composition entering,
  // not five elements arriving independently.
  const reveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: reduceMotion ? 0 : 0.08 * i, ease: [0.16, 1, 0.3, 1] as const },
    }),
  };

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-28">
      {/* ── Layer 1: base radial wash ── */}
      <div className="absolute inset-0 bg-nexplay-radial" />

      {/* ── Layer 2: aurora light blooms, slowly drifting ── */}
      <motion.div
        aria-hidden
        className="absolute -top-48 left-1/2 h-[680px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/25 blur-[160px]"
        animate={reduceMotion ? undefined : { x: [-40, 40, -40], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 right-[-10%] h-[520px] w-[620px] rounded-full bg-secondary/20 blur-[150px]"
        animate={reduceMotion ? undefined : { x: [30, -30, 30], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute left-[-8%] top-1/3 h-[380px] w-[420px] rounded-full bg-accent/10 blur-[130px]"
        animate={reduceMotion ? undefined : { y: [0, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Layer 3: grid, masked so it fades out toward the edges ── */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 40%, transparent 100%)",
        }}
      />

      {/* ── Layer 4: a few drifting motes. Six, not eighteen — enough to
           suggest atmosphere without a wall of animating elements. ── */}
      {!reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {[12, 28, 44, 61, 77, 91].map((left, i) => (
            <motion.span
              key={left}
              className="absolute h-1 w-1 rounded-full bg-primary/50"
              style={{ left: `${left}%`, bottom: "-8px" }}
              animate={{ y: ["0vh", "-108vh"], opacity: [0, 0.8, 0] }}
              transition={{ duration: 14 + i * 2, delay: i * 2.2, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container-nexplay relative z-10 flex flex-col items-center gap-7 text-center"
      >
        <motion.div variants={reveal} initial="hidden" animate="show" custom={0}>
          <Badge variant="primary">Now in Public Beta</Badge>
        </motion.div>

        <motion.h1
          variants={reveal}
          initial="hidden"
          animate="show"
          custom={1}
          className="max-w-4xl font-display text-[2.75rem] font-bold leading-[1.03] tracking-[-0.02em] text-white sm:text-6xl md:text-7xl"
        >
          Play. Compete.
          <br />
          <span className="text-gradient">Earn Real Rewards.</span>
        </motion.h1>

        <motion.p
          variants={reveal}
          initial="hidden"
          animate="show"
          custom={2}
          className="max-w-lg text-base leading-relaxed text-muted sm:text-lg"
        >
          Climb global leaderboards, enter live tournaments, and turn your skill into rewards.
        </motion.p>

        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-1 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Magnetic>
            <Button href="/register" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
              Start Playing Free
            </Button>
          </Magnetic>
          <Magnetic strength={0.25}>
            <Button href="/games" variant="outline" size="lg" icon={<Play className="h-4 w-4" />} iconPosition="left">
              Explore Games
            </Button>
          </Magnetic>
        </motion.div>

        {/* Real counts — a placeholder shimmer holds the space so the row
            doesn't shift when the numbers land. */}
        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {pills.map((pill) => (
            <div
              key={pill.label}
              className="glass group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-white"
            >
              <pill.icon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              {pill.value === undefined ? (
                <span className="inline-block h-3 w-10 animate-pulse rounded bg-white/10" />
              ) : (
                <span className="text-white">{formatCompactNumber(pill.value)}</span>
              )}
              {pill.label}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Floating glass slabs — depth cues at the edges, desktop only. */}
      <motion.div
        aria-hidden
        animate={reduceMotion ? undefined : { y: [0, -16, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-20 top-1/3 hidden h-44 w-44 rounded-[2rem] border border-white/5 bg-primary/[0.07] backdrop-blur-3xl lg:block"
      />
      <motion.div
        aria-hidden
        animate={reduceMotion ? undefined : { y: [0, 18, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-12 top-1/2 hidden h-36 w-36 rounded-[1.75rem] border border-white/5 bg-secondary/[0.07] backdrop-blur-3xl lg:block"
      />

      {/* Fade into the next section so the seam disappears. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}
