"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

/**
 * Generic accordion primitive (the FAQ section is a themed consumer
 * of this same interaction pattern — this version is unopinionated
 * for reuse in Game Details specs, rules panels, etc.).
 */
export function Accordion({ items, allowMultiple = false }: { items: AccordionItem[]; allowMultiple?: boolean }) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return allowMultiple ? [...prev, id] : [id];
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <GlassPanel key={item.id} className="overflow-hidden">
            <button
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-sm font-semibold text-white">{item.title}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-muted transition-transform duration-200", isOpen && "rotate-180 text-primary")}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="px-5 pb-5 text-sm text-muted">{item.content}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        );
      })}
    </div>
  );
}
