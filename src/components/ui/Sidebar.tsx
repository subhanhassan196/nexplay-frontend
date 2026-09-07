"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface SidebarProps {
  title?: string;
  children: ReactNode;
  /** Mobile-only slide-over mode */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Used as the Games-page filter panel and Dashboard secondary nav.
 * Static column on desktop; slide-over drawer on mobile when
 * `mobileOpen` is controlled by the parent.
 */
export function Sidebar({ title, children, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <GlassPanel className="hidden h-fit flex-col gap-6 p-6 lg:flex">
        {title && <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">{title}</h3>}
        {children}
      </GlassPanel>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="glass absolute left-0 top-0 flex h-full w-[85%] max-w-xs flex-col gap-6 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between">
                {title && <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">{title}</h3>}
                <button onClick={onMobileClose} aria-label="Close filters" className="text-muted hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
