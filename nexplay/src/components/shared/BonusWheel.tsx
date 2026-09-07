"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Gift, Clock, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { rewardsApi, type WheelSegmentDTO } from "@/lib/api/platform";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

/**
 * Daily bonus wheel.
 *
 * The outcome is decided entirely by the server: the client asks to spin,
 * the API picks the winning segment by weight, records it and credits coins
 * inside one transaction, then returns which slice to land on. Refreshing,
 * replaying the request or tampering client-side cannot produce a second
 * reward — a unique index on (user, date) makes that a database error.
 *
 * Segments are configured in the admin panel, so prizes can change without
 * touching this file. Coins are cosmetic profile currency with no cash value.
 */

const SPIN_DURATION_MS = 3600;
const RADIUS = 130;
const CENTER = 150;

interface BonusWheelProps {
  /** Lets the parent page update its coin display after a win. */
  onBalanceChange?: (balance: number) => void;
}

function slicePath(index: number, total: number): string {
  const angle = 360 / total;
  const start = (index * angle - 90) * (Math.PI / 180);
  const end = ((index + 1) * angle - 90) * (Math.PI / 180);
  const x1 = CENTER + RADIUS * Math.cos(start);
  const y1 = CENTER + RADIUS * Math.sin(start);
  const x2 = CENTER + RADIUS * Math.cos(end);
  const y2 = CENTER + RADIUS * Math.sin(end);
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function labelTransform(index: number, total: number) {
  const angle = 360 / total;
  const mid = index * angle + angle / 2 - 90;
  const rad = mid * (Math.PI / 180);
  const r = RADIUS * 0.66;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad), rotate: mid };
}

export function BonusWheel({ onBalanceChange }: BonusWheelProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const [segments, setSegments] = useState<WheelSegmentDTO[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [lastPrize, setLastPrize] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the wheel layout, and the user's eligibility if signed in.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await rewardsApi.wheelSegments();
        if (!cancelled) setSegments(data.data.segments);

        if (isAuthenticated) {
          const status = await rewardsApi.spinStatus();
          if (!cancelled) setCanSpin(status.data.data.canSpin);
        }
      } catch {
        if (!cancelled) setSegments([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated]);

  const paths = useMemo(() => segments.map((_, i) => slicePath(i, segments.length)), [segments]);
  const labels = useMemo(() => segments.map((_, i) => labelTransform(i, segments.length)), [segments]);

  const spin = useCallback(async () => {
    if (spinning || !canSpin || segments.length === 0) return;
    setSpinning(true);
    setLastPrize(null);

    try {
      // The server decides the outcome — we only animate to it.
      const { data } = await rewardsApi.spin();
      const result = data.data;

      const index = segments.findIndex((s) => s.id === result.segment.id);
      const angle = 360 / segments.length;
      const target = 360 * 5 - (index >= 0 ? index : 0) * angle - angle / 2;
      setRotation((r) => r + target);

      timerRef.current = setTimeout(
        () => {
          setSpinning(false);
          setCanSpin(false);
          setLastPrize(result.segment.label);
          onBalanceChange?.(result.balance);

          const blank = result.coinsWon === 0 && result.segment.rewardType === "NOTHING";
          toast({
            variant: blank ? "info" : "success",
            title: blank ? "No luck this time" : "You won a reward!",
            description: blank ? "Come back tomorrow for another free spin." : result.segment.label,
          });
        },
        reduceMotion ? 200 : SPIN_DURATION_MS
      );
    } catch (err) {
      setSpinning(false);
      toast({ variant: "error", title: "Couldn't spin", description: getApiErrorMessage(err) });
    }
  }, [spinning, canSpin, segments, reduceMotion, toast, onBalanceChange]);

  const buttonLabel = !isAuthenticated
    ? "Log in to spin"
    : spinning
      ? "Spinning…"
      : canSpin
        ? "Spin for Free"
        : "Already spun today";

  return (
    <GlassPanel className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="font-display text-lg font-bold text-white">Daily Bonus Wheel</h2>
      </div>

      {isLoading ? (
        <div className="h-[300px] w-[300px] animate-pulse rounded-full bg-white/5" />
      ) : segments.length === 0 ? (
        <p className="py-16 text-sm text-muted">The wheel is being configured — check back soon.</p>
      ) : (
        <div className="relative">
          {/* Pointer */}
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
            <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-accent drop-shadow-lg" />
          </div>

          <div
            className={cn(
              "rounded-full p-1.5 transition-shadow duration-500",
              spinning ? "shadow-[0_0_40px_-4px_rgba(124,58,237,0.7)]" : "shadow-[0_0_24px_-8px_rgba(124,58,237,0.5)]"
            )}
            style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4, #F59E0B)" }}
          >
            <motion.svg
              width={300}
              height={300}
              viewBox="0 0 300 300"
              role="img"
              aria-label={`Bonus wheel with ${segments.length} prize segments`}
              className="block rounded-full bg-background"
              animate={{ rotate: rotation }}
              transition={
                reduceMotion ? { duration: 0.2 } : { duration: SPIN_DURATION_MS / 1000, ease: [0.16, 1, 0.3, 1] }
              }
            >
              {segments.map((seg, i) => (
                <g key={seg.id}>
                  <path d={paths[i]} fill={seg.color} stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
                  <text
                    x={labels[i].x}
                    y={labels[i].y}
                    transform={`rotate(${labels[i].rotate} ${labels[i].x} ${labels[i].y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                    style={{ fill: "#fff", fontSize: 12, fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                  >
                    {seg.label}
                  </text>
                </g>
              ))}
            </motion.svg>
          </div>

          {/* Hub */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-nexplay-gradient shadow-xl">
            <Gift className="h-6 w-6 text-white" />
          </div>
        </div>
      )}

      {lastPrize && !spinning && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-white" role="status">
          You landed on <span className="font-semibold text-accent">{lastPrize}</span>
        </motion.p>
      )}

      <button
        onClick={spin}
        disabled={!isAuthenticated || !canSpin || spinning || segments.length === 0}
        className={cn(
          "flex w-full max-w-xs items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/60",
          isAuthenticated && canSpin && !spinning
            ? "bg-nexplay-gradient text-white hover:opacity-90 active:scale-[0.98]"
            : "cursor-not-allowed bg-white/5 text-muted"
        )}
      >
        {spinning && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
      </button>

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Clock className="h-3.5 w-3.5" />
        {canSpin ? "1 free spin available today" : "Next free spin resets tomorrow"}
      </p>

      <p className="max-w-xs text-[11px] leading-relaxed text-muted/70">
        Coins and cosmetics are profile rewards only — they have no cash value and cannot be withdrawn or exchanged.
      </p>
    </GlassPanel>
  );
}
