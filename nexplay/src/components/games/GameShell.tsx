"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Clock,
  Trophy,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGameSettings } from "@/hooks/useGameSettings";
import { cn } from "@/lib/utils";

interface GameShellProps {
  title: string;
  score: number;
  highScore?: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isGameOver: boolean;
  statusLabel?: string;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  children: ReactNode;
  /** Rendered below the controls — e.g. difficulty selector, turn indicator. */
  toolbar?: ReactNode;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameShell({
  title,
  score,
  highScore,
  elapsedSeconds,
  isPaused,
  isGameOver,
  statusLabel,
  onPause,
  onResume,
  onRestart,
  children,
  toolbar,
}: GameShellProps) {
  const { settings, toggleSound } = useGameSettings();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleFullscreenToggle() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => undefined);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => undefined);
      setIsFullscreen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("min-h-screen bg-background pt-24", isFullscreen && "flex flex-col justify-center pt-4")}
    >
      <div className="container-nexplay flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/games"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white"
              aria-label="Back to games"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
            {statusLabel && <Badge variant="primary">{statusLabel}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <GlassPanel className="flex items-center gap-4 px-4 py-2">
              <span className="flex items-center gap-1.5 text-sm text-white">
                <Trophy className="h-4 w-4 text-accent" />
                {score}
              </span>
              {typeof highScore === "number" && (
                <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">Best: {highScore}</span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Clock className="h-4 w-4" />
                {formatTime(elapsedSeconds)}
              </span>
            </GlassPanel>

            <button
              onClick={toggleSound}
              aria-label={settings.soundEnabled ? "Mute sound" : "Unmute sound"}
              aria-pressed={settings.soundEnabled}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white"
            >
              {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {!isGameOver && (
              <button
                onClick={isPaused ? onResume : onPause}
                aria-label={isPaused ? "Resume" : "Pause"}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            )}

            <button
              onClick={onRestart}
              aria-label="Restart game"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={handleFullscreenToggle}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white sm:flex"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {toolbar}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex justify-center pb-16"
        >
          <GlassPanel className="relative w-full max-w-2xl p-6 sm:p-8">
            {isPaused && !isGameOver && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/80 backdrop-blur-sm">
                <p className="font-display text-xl font-semibold text-white">Paused</p>
                <Button onClick={onResume} icon={<Play className="h-4 w-4" />} iconPosition="left">
                  Resume
                </Button>
              </div>
            )}
            {children}
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
