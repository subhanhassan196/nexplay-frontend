"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { type BootstrapDTO, type QuickLinkCategory } from "@/lib/api/messenger";
import { cn } from "@/lib/utils";

interface WelcomeViewProps {
  bootstrap: BootstrapDTO;
}

const categoryLabels: Record<QuickLinkCategory, string> = {
  FEATURED_GAME: "Featured",
  TRENDING_GAME: "Trending",
  REWARD: "Rewards",
  TOURNAMENT: "Tournaments",
  CASINO: "Casino",
  POKER: "Poker",
  ROULETTE: "Roulette",
  BLACKJACK: "Blackjack",
  SLOTS: "Slots",
  GENERAL: "More",
};

// Resolve a lucide icon by name at runtime (admin stores the icon name as a string).
function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) || Icons.Sparkles;
  return <Icon className={className} />;
}

export function WelcomeView({ bootstrap }: WelcomeViewProps) {
  // Group quick links by category
  const grouped = bootstrap.quickLinks.reduce<Record<string, typeof bootstrap.quickLinks>>((acc, link) => {
    (acc[link.category] ||= []).push(link);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-nexplay-gradient/15 p-4"
      >
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", bootstrap.isOnline ? "bg-success" : "bg-muted")} />
          <span className="text-xs text-muted">
            {bootstrap.isOnline ? "We're online" : "We're offline"} · {bootstrap.supportHours}
          </span>
        </div>
        <p className="mt-2 text-sm text-white/90">{bootstrap.welcomeMessage}</p>
      </motion.div>

      {/* Announcements */}
      {bootstrap.announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          {bootstrap.announcements.slice(0, 2).map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-medium text-white">{a.title}</p>
              <p className="mt-0.5 text-xs text-muted">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {Object.entries(grouped).map(([category, links]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            {categoryLabels[category as QuickLinkCategory] ?? category}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.url}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <DynamicIcon name={link.iconName} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{link.label}</span>
                  {link.description && <span className="block truncate text-[10px] text-muted">{link.description}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <p className="pt-1 text-center text-xs text-muted">Type a message below to start chatting with support.</p>
    </div>
  );
}
