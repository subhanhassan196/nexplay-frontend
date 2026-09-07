"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useMessenger } from "@/context/MessengerContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function MessengerLauncher() {
  const { isOpen, toggle, unreadCount } = useMessenger();
  const { isAuthenticated } = useAuth();

  // Messenger is a signed-in experience — hide the launcher for guests.
  if (!isAuthenticated) return null;

  return (
    <motion.button
      onClick={toggle}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? "Close support chat" : "Open support chat"}
      className="fixed bottom-6 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-nexplay-gradient shadow-glow-primary sm:right-6"
    >
      {/* Notification pulse ring */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
      )}

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
          >
            <X className="h-6 w-6 text-white" />
          </motion.span>
        ) : (
          <motion.span
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Unread badge */}
      {!isOpen && unreadCount > 0 && (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-danger px-1 text-xs font-bold text-white"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </motion.button>
  );
}
