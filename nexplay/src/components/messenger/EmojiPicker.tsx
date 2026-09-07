"use client";

import { motion } from "framer-motion";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎮", "🏆", "👏", "🙏", "😎", "✅"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 6 }}
      className="grid grid-cols-6 gap-1 rounded-2xl border border-white/10 bg-surface/95 p-2 shadow-xl backdrop-blur-md"
    >
      {EMOJIS.map((emoji) => (
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

export { EMOJIS };
