"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Registers the service worker and offers an install prompt.
 *
 * The prompt only appears when the browser says the app is actually
 * installable, and it's dismissible for the session — an install banner
 * that reappears on every page is the fastest way to make people ignore
 * it (or leave).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "nexplay-install-dismissed";

export function PWAProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register only in production — in dev the worker caches builds and
    // makes changes appear not to take effect, which is maddening.
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* installability is a bonus, never a hard requirement */
      });
    }

    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";

    function onPrompt(e: Event) {
      // Stop the browser's own mini-infobar so ours is the only prompt.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-4 bottom-24 z-[95] mx-auto max-w-sm rounded-2xl border border-white/10 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:left-6 sm:right-auto"
          role="dialog"
          aria-label="Install NexPlay"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nexplay-gradient">
              <Download className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Install NexPlay</p>
              <p className="mt-0.5 text-xs text-muted">
                Add it to your home screen for faster access and full-screen play.
              </p>
              <button
                onClick={install}
                className="mt-3 rounded-lg bg-nexplay-gradient px-4 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Install
              </button>
            </div>
            <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
