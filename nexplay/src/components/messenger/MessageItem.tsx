"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Headset, Info, MoreVertical, Reply, Pencil, Trash2, Copy, Smile, Check, CheckCheck, Gamepad2, X } from "lucide-react";
import { EmojiPicker } from "@/components/messenger/EmojiPicker";
import { useAuth } from "@/context/AuthContext";
import { type MessageDTO } from "@/lib/api/messenger";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: MessageDTO;
  onReply: (message: MessageDTO) => void;
  onEdit: (message: MessageDTO) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string, add: boolean) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageItem({ message, onReply, onEdit, onDelete, onReact }: MessageItemProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const isUser = message.senderType === "USER";
  const isSystem = message.senderType === "SYSTEM" || message.senderType === "BOT";
  const isMine = isUser && message.senderId === user?.id;
  const isDeleted = Boolean(message.deletedAt);

  if (isSystem) {
    return (
      <div className="flex justify-center px-3 py-1.5">
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted">
          <Info className="h-3 w-3" />
          <span className="max-w-[240px] text-center">{message.content}</span>
        </div>
      </div>
    );
  }

  // Group reactions by emoji with counts
  const reactionCounts = message.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});
  const myReactions = new Set(message.reactions.filter((r) => r.userId === user?.id).map((r) => r.emoji));

  return (
    <div className={cn("group relative flex gap-2 px-3 py-1", isMine && "flex-row-reverse")}>
      {!isMine && (
        <span
          className={cn(
            "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            message.senderType === "AGENT" ? "bg-accent/20 text-accent" : "bg-secondary/20 text-secondary"
          )}
        >
          {message.senderType === "AGENT" ? <Headset className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </span>
      )}

      <div className={cn("flex max-w-[78%] flex-col gap-1", isMine && "items-end")}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className="max-w-full rounded-lg border-l-2 border-primary/50 bg-white/[0.03] px-2 py-1 text-xs text-muted">
            <span className="line-clamp-1">
              {message.replyTo.deletedAt ? "Deleted message" : message.replyTo.content}
            </span>
          </div>
        )}

        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-sm leading-relaxed",
              isMine
                ? "rounded-tr-sm bg-nexplay-gradient text-white"
                : "rounded-tl-sm border border-white/10 bg-white/[0.05] text-white/90",
              isDeleted && "italic opacity-60"
            )}
          >
            {/* Image attachments — click to open full size */}
            {!isDeleted && message.attachmentUrls.length > 0 && (
              <div className="mb-1.5 flex flex-col gap-1.5">
                {message.attachmentUrls.map((url) => (
                  <button
                    key={url}
                    onClick={() => setLightbox(url)}
                    className="block overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40"
                    aria-label="Open image full size"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Shared attachment"
                      loading="lazy"
                      className="max-h-64 w-full max-w-[260px] object-cover transition-transform hover:scale-[1.02]"
                    />
                  </button>
                ))}
              </div>
            )}

            {isDeleted ? "This message was deleted" : message.content}
            {message.editedAt && !isDeleted && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}

            {/* Which game this question came from, if any */}
            {!isDeleted && message.gameTitle && (
              <span
                className={cn(
                  "mt-1.5 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                  isMine ? "bg-white/20 text-white/90" : "bg-primary/15 text-primary"
                )}
              >
                <Gamepad2 className="h-2.5 w-2.5" />
                {message.gameTitle}
              </span>
            )}
          </div>

          {/* Hover actions */}
          {!isDeleted && (
            <div
              className={cn(
                "absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                isMine ? "right-full mr-1" : "left-full ml-1"
              )}
            >
              <button
                onClick={() => setEmojiOpen((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/80 text-muted hover:text-white"
                aria-label="React"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onReply(message)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/80 text-muted hover:text-white"
                aria-label="Reply"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/80 text-muted hover:text-white"
                aria-label="More"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {emojiOpen && (
              <div className={cn("absolute z-30 mt-1", isMine ? "right-0" : "left-0")}>
                <EmojiPicker
                  onSelect={(emoji) => {
                    onReact(message.id, emoji, !myReactions.has(emoji));
                    setEmojiOpen(false);
                  }}
                />
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "absolute z-30 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-surface/95 shadow-xl backdrop-blur-md",
                  isMine ? "right-0" : "left-0"
                )}
              >
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content).catch(() => undefined);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                {isMine && (
                  <>
                    <button
                      onClick={() => {
                        onEdit(message);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(message.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-white/5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji, !myReactions.has(emoji))}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                  myReactions.has(emoji) ? "border-primary/50 bg-primary/15" : "border-white/10 bg-white/[0.03]"
                )}
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-muted">{count}</span>
              </button>
            ))}
          </div>
        )}

        <div className={cn("flex items-center gap-1 px-1 text-[10px] text-muted", isMine && "flex-row-reverse")}>
          <span>{formatTime(message.createdAt)}</span>
          {isMine && <CheckCheck className="h-3 w-3 text-secondary" />}
        </div>
      </div>

      {/* Full-size image viewer */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Attachment, full size"
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
