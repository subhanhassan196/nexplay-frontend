"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: ReactNode; ring: string }> = {
  success: { icon: <CheckCircle2 className="h-5 w-5 text-success" />, ring: "border-success/30" },
  error: { icon: <XCircle className="h-5 w-5 text-danger" />, ring: "border-danger/30" },
  info: { icon: <Info className="h-5 w-5 text-secondary" />, ring: "border-secondary/30" },
};

/**
 * Global toast provider. Wrap the app once (root layout) and call
 * `useToast().toast(...)` anywhere client-side to surface a notification —
 * ready for real events (reward redeemed, tournament joined) in Phase 3.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "glass pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-glass",
                variantStyles[t.variant].ring
              )}
            >
              {variantStyles[t.variant].icon}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
