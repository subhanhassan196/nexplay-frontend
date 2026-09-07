"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  LogIn,
  LogOut,
  MessageSquare,
  Settings,
  Megaphone,
  Ticket,
  Gamepad2,
  Shield,
  Link2,
} from "lucide-react";
import { activityApi, type ActivityDTO } from "@/lib/api/activity";
import { cn } from "@/lib/utils";

const actionMeta: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  "user.login": { label: "User logged in", icon: LogIn, color: "text-success" },
  "user.logout": { label: "User logged out", icon: LogOut, color: "text-muted" },
  "user.register": { label: "New registration", icon: Shield, color: "text-primary" },
  "ticket.created": { label: "Ticket created", icon: Ticket, color: "text-primary" },
  "ticket.replied": { label: "Ticket reply", icon: MessageSquare, color: "text-secondary" },
  "ticket.state_changed": { label: "Ticket status changed", icon: Ticket, color: "text-accent" },
  "ticket.assigned": { label: "Ticket assigned", icon: Ticket, color: "text-accent" },
  "conversation.closed": { label: "Conversation closed", icon: MessageSquare, color: "text-muted" },
  "settings.changed": { label: "Settings changed", icon: Settings, color: "text-accent" },
  "announcement.published": { label: "Announcement published", icon: Megaphone, color: "text-primary" },
  "quicklink.changed": { label: "Quick link changed", icon: Link2, color: "text-secondary" },
  "game.viewed": { label: "Game viewed", icon: Gamepad2, color: "text-muted" },
  "admin.action": { label: "Admin action", icon: Shield, color: "text-primary" },
};

const FILTERS = [
  { label: "All", value: "" },
  { label: "Tickets", value: "ticket.replied" },
  { label: "Logins", value: "user.login" },
  { label: "Settings", value: "settings.changed" },
  { label: "Announcements", value: "announcement.published" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await activityApi.list({ limit: 50, action: filter || undefined });
      setActivities(data.data);
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Activity Center</h1>
        <p className="text-sm text-muted">A live log of everything happening across the platform.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === f.value ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-surface/40 p-12 text-center">
          <Activity className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-1">
          {activities.map((a, i) => {
            const meta = actionMeta[a.action] ?? { label: a.action, icon: Activity, color: "text-muted" };
            const Icon = meta.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5", meta.color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">
                    {meta.label}
                    {a.actor && <span className="text-muted"> · {a.actor.username}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {a.entityType} · {timeAgo(a.createdAt)}
                    {a.ipAddress && ` · ${a.ipAddress}`}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
