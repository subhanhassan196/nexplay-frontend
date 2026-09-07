"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, Smile, Heart, Hand, Gamepad2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * In-app emoji picker.
 *
 * Deliberately not the OS keyboard picker — desktop users have no easy
 * way to reach that, so the composer needs its own. Categories plus a
 * search box keep it usable without shipping a full unicode dataset:
 * this is the set people actually reach for in a support chat.
 *
 * `compact` renders the small reaction grid used on message bubbles.
 */
const CATEGORIES = [
  {
    id: "recent",
    label: "Frequently used",
    icon: Clock,
    emojis: ["👍", "🙏", "❤️", "😂", "✅", "🔥", "😊", "👋", "🎮", "🏆", "😮", "😢"],
  },
  {
    id: "smileys",
    label: "Smileys",
    icon: Smile,
    emojis: [
      "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
      "🙂","🙃","😉","😌","😍","🥰","😘","😋","😛","😜",
      "🤪","🤨","🧐","🤓","😎","🥳","😏","😒","😞","😔",
      "😟","🙁","😣","😖","😫","😩","🥺","😢","😭","😤",
      "😠","😡","😳","🥵","😱","😨","😰","😥","😓","🤗",
      "🤔","🤭","🤫","😶","😐","😑","😬","🙄","😯","😮",
      "😲","🥱","😴","🤤","😪","🤐","🥴","🤢","🤧","😷",
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    icon: Hand,
    emojis: [
      "👍","👎","👌","🤌","✌️","🤞","🤟","🤘","🤙","👈",
      "👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤝",
      "🙏","✍️","💪","🦾","👏","🙌","👐","🤲","🫶","👊",
    ],
  },
  {
    id: "hearts",
    label: "Hearts & symbols",
    icon: Heart,
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
      "❣️","💕","💞","💓","💗","💖","💘","💝","✅","❌",
      "❓","❗","💯","⭐","🌟","✨","⚡","🔥","💥","🎉",
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad2,
    emojis: [
      "🎮","🕹️","🎯","🎲","🃏","🏆","🥇","🥈","🥉","🎖️",
      "🏅","👑","💎","🪙","🎁","🚀","⚔️","🛡️","🎪","🎊",
    ],
  },
  {
    id: "objects",
    label: "Objects",
    icon: Sparkles,
    emojis: [
      "📱","💻","⌨️","🖥️","📷","🎧","🔋","🔌","💡","🔍",
      "📁","📄","📊","📈","📉","🔒","🔑","⏰","📅","📌",
      "✉️","📧","💬","💭","🔔","🔕","⚙️","🛠️","🧾","💰",
    ],
  },
] as const;

/** Small keyword index so search finds the obvious things. */
const KEYWORDS: Record<string, string> = {
  "👍": "thumbs up yes ok good",
  "👎": "thumbs down no bad",
  "🙏": "please thanks pray sorry",
  "❤️": "heart love",
  "😂": "laugh funny lol",
  "😊": "smile happy",
  "😢": "sad cry",
  "😡": "angry mad",
  "🔥": "fire hot",
  "✅": "check done tick yes",
  "❌": "cross no wrong",
  "🎮": "game gaming controller",
  "🏆": "trophy win winner",
  "💰": "money cash coin",
  "⚙️": "settings gear",
  "🔒": "lock secure",
  "💬": "chat message",
  "👋": "wave hello hi bye",
  "🎉": "party celebrate congrats",
  "⭐": "star favourite",
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  compact?: boolean;
}

export function EmojiPicker({ onSelect, compact = false }: EmojiPickerProps) {
  const [active, setActive] = useState<string>("recent");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES.find((c) => c.id === active)?.emojis ?? [];

    const all = CATEGORIES.flatMap((c) => c.emojis as readonly string[]);
    return Array.from(new Set(all)).filter((e) => e.includes(q) || (KEYWORDS[e] ?? "").includes(q));
  }, [active, query]);

  // Reaction grid on message bubbles — small and fixed.
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 6 }}
        className="grid grid-cols-6 gap-1 rounded-2xl border border-white/10 bg-surface/95 p-2 shadow-xl backdrop-blur-md"
      >
        {CATEGORIES[0].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/10"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.15 }}
      className="flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl"
      role="dialog"
      aria-label="Choose an emoji"
    >
      <div className="border-b border-white/10 p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto p-2">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">No emoji found.</p>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {visible.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/10"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category tabs — hidden while searching, since results span all. */}
      {!query && (
        <div className="flex border-t border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              aria-pressed={active === cat.id}
              aria-label={cat.label}
              title={cat.label}
              className={cn(
                "flex flex-1 items-center justify-center py-2 transition-colors",
                active === cat.id ? "border-t-2 border-primary text-white" : "text-muted hover:text-white"
              )}
            >
              <cat.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** Reaction shortlist, used by message reaction menus. */
export const EMOJIS = CATEGORIES[0].emojis;
