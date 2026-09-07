"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, Frown, Handshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface GameOverOverlayProps {
  outcome: "win" | "lose" | "draw";
  title: string;
  description?: string;
  onPlayAgain: () => void;
}

const outcomeStyles = {
  win: { icon: Trophy, color: "text-accent", bg: "bg-accent/10" },
  lose: { icon: Frown, color: "text-danger", bg: "bg-danger/10" },
  draw: { icon: Handshake, color: "text-secondary", bg: "bg-secondary/10" },
} as const;

export function GameOverOverlay({ outcome, title, description, onPlayAgain }: GameOverOverlayProps) {
  const { icon: Icon, color, bg } = outcomeStyles[outcome];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/90 backdrop-blur-md"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", bg, color)}
      >
        <Icon className="h-8 w-8" />
      </motion.span>
      <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
      {description && <p className="text-sm text-muted">{description}</p>}
      <Button onClick={onPlayAgain} size="lg" icon={<RotateCcw className="h-4 w-4" />} iconPosition="left">
        Play Again
      </Button>
    </motion.div>
  );
}
