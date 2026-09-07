"use client";

import Image from "next/image";
import { X, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMessenger } from "@/context/MessengerContext";

/**
 * Subtle "you're viewing X" strip shown at the top of the messenger when
 * the user opened support from a game detail page. Dismissible — the
 * conversation stays global either way, this only tags outgoing messages.
 */
export function GameContextBanner() {
  const { gameContext, setGameContext } = useMessenger();

  return (
    <AnimatePresence>
      {gameContext && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden border-b border-white/10 bg-primary/10"
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/5">
              {gameContext.logoUrl ? (
                <Image
                  src={gameContext.logoUrl}
                  alt={`${gameContext.title} artwork`}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <Gamepad2 className="m-auto h-4 w-4 text-primary" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-muted">Viewing</p>
              <p className="truncate text-sm font-medium text-white">{gameContext.title}</p>
            </div>
            <button
              onClick={() => setGameContext(null)}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Clear game context"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
