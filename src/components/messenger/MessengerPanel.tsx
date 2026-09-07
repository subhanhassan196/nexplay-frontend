"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, Minimize2, Maximize2, ChevronDown, Headset } from "lucide-react";
import { useMessenger, type MessengerSize } from "@/context/MessengerContext";
import { MessageItem } from "@/components/messenger/MessageItem";
import { WelcomeView } from "@/components/messenger/WelcomeView";
import type { UploadedAttachment } from "@/lib/api/messenger";
import { MessengerComposer } from "@/components/messenger/MessengerComposer";
import { GameContextBanner } from "@/components/messenger/GameContextBanner";
import { TypingIndicator } from "@/components/messenger/TypingIndicator";
import { type MessageDTO } from "@/lib/api/messenger";
import { cn } from "@/lib/utils";

const sizeClasses: Record<MessengerSize, string> = {
  // Desktop-only presets. On phones the panel is a full-height sheet
  // instead, so these are namespaced behind `sm:`.
  small: "sm:w-[360px] sm:h-[560px]",
  medium: "sm:w-[400px] sm:h-[640px]",
  large: "sm:w-[440px] sm:h-[720px]",
};

function dateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function MessengerPanel() {
  const {
    isOpen,
    close,
    size,
    setSize,
    messages,
    bootstrap,
    isLoading,
    isSending,
    conversationState,
    isAgentTyping,
    emitTyping,
    sendMessage,
    uploadAttachment,
    uploadFile,
    agent,
    editMessage,
    deleteMessage,
    toggleReaction,
  } = useMessenger();

  // While the sheet covers the screen on mobile, stop the page behind it
  // from scrolling — otherwise a swipe moves the page under the chat and
  // the two appear to overlap.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const isSheet = window.matchMedia("(max-width: 639px)").matches;
    if (!isOpen || !isSheet) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
  const [editing, setEditing] = useState<MessageDTO | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery) {
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    }
  }, [messages, searchQuery, isOpen]);

  const visibleMessages = useMemo(
    () =>
      searchQuery
        ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages,
    [messages, searchQuery]
  );

  // Insert date separators between messages of different days.
  const withSeparators = useMemo(() => {
    const items: Array<{ type: "date"; label: string; key: string } | { type: "msg"; message: MessageDTO }> = [];
    let lastDate = "";
    for (const message of visibleMessages) {
      const label = dateLabel(message.createdAt);
      if (label !== lastDate) {
        items.push({ type: "date", label, key: `date-${label}-${message.id}` });
        lastDate = label;
      }
      items.push({ type: "msg", message });
    }
    return items;
  }, [visibleMessages]);

  const hasStartedChat = messages.some((m) => m.senderType !== "SYSTEM" && m.senderType !== "BOT");

  async function handleSend(content: string, attachmentUrls?: string[], attachments?: UploadedAttachment[]) {
    await sendMessage(content, replyTo?.id, attachmentUrls, attachments);
    setReplyTo(null);
  }

  async function handleEditSubmit(messageId: string, content: string) {
    await editMessage(messageId, content);
    setEditing(null);
  }

  function cycleSize() {
    const order: MessengerSize[] = ["small", "medium", "large"];
    const next = order[(order.indexOf(size) + 1) % order.length];
    setSize(next);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden border-white/10 bg-background/95 shadow-2xl backdrop-blur-xl",
            // Phone: a sheet pinned to every edge. `dvh` rather than `vh`
            // so the mobile browser's collapsing address bar doesn't hide
            // the composer behind it.
            "inset-x-0 bottom-0 top-0 h-[100dvh] w-full rounded-none border-0",
            // Desktop: a floating window above the launcher.
            "sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-auto sm:w-auto sm:rounded-3xl sm:border",
            "sm:max-h-[calc(100dvh-8rem)] sm:max-w-[calc(100vw-3rem)]",
            sizeClasses[size]
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-nexplay-gradient/10 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-nexplay-gradient text-white">
              <Headset className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-semibold text-white">NexPlay Support</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <span className={cn("h-1.5 w-1.5 rounded-full", bootstrap?.isOnline ? "bg-success" : "bg-muted")} />
                {bootstrap?.isOnline ? "Online" : "Offline"}
              </p>
            </div>

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-white"
              aria-label="Search messages"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={cycleSize}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-white sm:flex"
              aria-label="Resize"
            >
              {size === "large" ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/10 px-3 py-2"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversation…"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          {/* Who's handling this thread. Only shown once an agent has
              actually picked it up — a name makes support feel human. */}
          {agent && (
            <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.02] px-4 py-2">
              <span className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30">
                {agent.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agent.avatarUrl} alt={`${agent.username} avatar`} className="h-full w-full object-cover" />
                ) : (
                  <span className="m-auto text-[9px] font-semibold text-white">
                    {agent.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {agent.isOnline && (
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background bg-success" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">{agent.username}</p>
                <p className="text-[10px] text-muted">{agent.isOnline ? "Online now" : "Your support agent"}</p>
              </div>
            </div>
          )}

          <GameContextBanner />

          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cn("h-10 animate-pulse rounded-2xl bg-white/5", i % 2 && "ml-auto w-2/3")} />
                ))}
              </div>
            ) : searchQuery ? (
              withSeparators.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">No messages found.</p>
              ) : (
                <div className="py-2">
                  {withSeparators.map((item) =>
                    item.type === "date" ? null : (
                      <MessageItem
                        key={item.message.id}
                        message={item.message}
                        onReply={setReplyTo}
                        onEdit={setEditing}
                        onDelete={deleteMessage}
                        onReact={toggleReaction}
                      />
                    )
                  )}
                </div>
              )
            ) : (
              <>
                {bootstrap && !hasStartedChat && <WelcomeView bootstrap={bootstrap} />}
                <div className="py-2">
                  {withSeparators.map((item) =>
                    item.type === "date" ? (
                      <div key={item.key} className="flex justify-center py-2">
                        <span className="rounded-full bg-white/5 px-3 py-0.5 text-[10px] text-muted">{item.label}</span>
                      </div>
                    ) : (
                      <MessageItem
                        key={item.message.id}
                        message={item.message}
                        onReply={setReplyTo}
                        onEdit={setEditing}
                        onDelete={deleteMessage}
                        onReact={toggleReaction}
                      />
                    )
                  )}
                </div>
              </>
            )}
            {isAgentTyping && !searchQuery && (
              <div className="px-3 pb-2">
                <TypingIndicator label="Support" />
              </div>
            )}
          </div>

          {/* Composer */}
          <MessengerComposer
            onSend={handleSend}
            onUploadAttachment={uploadAttachment}
            onUploadFile={uploadFile}
            onEditSubmit={handleEditSubmit}
            replyTo={replyTo}
            editing={editing}
            onCancelReply={() => setReplyTo(null)}
            onCancelEdit={() => setEditing(null)}
            onTyping={emitTyping}
            disabled={isSending || conversationState === "ARCHIVED"}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
