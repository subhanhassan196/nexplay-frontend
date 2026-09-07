"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  Trash2,
  Trophy,
  Megaphone,
  MessageSquare,
  Users,
  Award,
  Info,
  X,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { type NotificationType } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

const iconFor: Record<NotificationType, typeof Bell> = {
  FRIEND_REQUEST: Users,
  FRIEND_ACCEPTED: Users,
  NEW_FOLLOWER: Users,
  ACHIEVEMENT_UNLOCKED: Trophy,
  BADGE_EARNED: Award,
  TOURNAMENT_INVITE: Trophy,
  TOURNAMENT_STARTING: Trophy,
  TOURNAMENT_RESULT: Trophy,
  LEADERBOARD_RANK_CHANGE: Trophy,
  COMMUNITY_COMMENT: MessageSquare,
  COMMUNITY_LIKE: MessageSquare,
  COMMUNITY_MENTION: MessageSquare,
  SUPPORT_REPLY: MessageSquare,
  ANNOUNCEMENT: Megaphone,
  SYSTEM: Info,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, isOpen, toggle, close, markRead, markAllRead, remove, clearRead } =
    useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    if (isOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen, close]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 top-12 z-[70] w-80 overflow-hidden rounded-2xl border border-white/10 bg-background/95 shadow-2xl backdrop-blur-xl sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-display text-sm font-semibold text-white">Notifications</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-white/5" title="Mark all read">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={clearRead} className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5" title="Clear read">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = iconFor[n.type] ?? Info;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "group flex items-start gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/[0.03]",
                        !n.isRead && "bg-primary/[0.06]"
                      )}
                      onClick={() => !n.isRead && markRead(n.id)}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>}
                        <p className="mt-1 text-[10px] text-muted">{timeAgo(n.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(n.id);
                          }}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Delete"
                        >
                          <X className="h-3.5 w-3.5 text-muted hover:text-danger" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
