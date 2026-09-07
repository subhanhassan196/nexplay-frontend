"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Base modal/dialog primitive. Used for confirmation dialogs, quick-view
 * game previews, and future auth modals. Renders via portal to <body>
 * and traps scroll while open.
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassPanel className={cn("relative w-full max-w-lg p-6", className)}>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              {title && <h2 className="mb-4 font-display text-lg font-semibold text-white">{title}</h2>}
              {children}
            </GlassPanel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
