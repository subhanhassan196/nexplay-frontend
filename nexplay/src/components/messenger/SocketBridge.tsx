"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

/**
 * Runs the useSocket lifecycle hook once, high in the tree, so the
 * shared socket connects on login and disconnects on logout. Also
 * renders a subtle "reconnecting" banner when the connection drops so
 * users know why real-time updates paused.
 */
export function SocketBridge() {
  const { isReconnecting } = useSocket();

  return (
    <AnimatePresence>
      {isReconnecting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-surface/95 px-4 py-2 text-xs text-white shadow-xl backdrop-blur-md"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Reconnecting…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
