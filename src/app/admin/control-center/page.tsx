"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MessagesSquare,
  Gamepad2,
  Coins,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trophy,
  Inbox,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { adminPlatformApi, type ControlCenterDTO } from "@/lib/api/adminPlatform";
import { formatCompactNumber, cn } from "@/lib/utils";

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * NexPlay Control Center — the operational overview a super admin opens
 * first. Every number is live, and anything needing attention surfaces
 * as an alert rather than expecting the operator to spot it in the data.
 */
export default function ControlCenterPage() {
  const [data, setData] = useState<ControlCenterDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminPlatformApi.controlCenter();
      setData(res.data.data);
      setLastChecked(new Date());
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, [load]);

  if (isLoading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <GlassPanel className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
          <p className="text-sm text-white">Couldn&apos;t load the control center.</p>
          <button onClick={load} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-muted hover:text-white">
            Retry
          </button>
        </GlassPanel>
      </div>
    );
  }

  const healthy = data.system.status === "healthy";

  const stats = [
    { label: "Total Players", value: formatCompactNumber(data.users.total), sub: `+${data.users.new24h} today`, icon: Users, color: "text-primary" },
    { label: "Active Sessions", value: formatCompactNumber(data.users.activeSessions), sub: "signed in now", icon: Zap, color: "text-secondary" },
    { label: "Open Conversations", value: data.support.open, sub: `${data.support.unassigned} unassigned`, icon: MessagesSquare, color: "text-accent", href: "/admin/conversations" },
    { label: "Messages (24h)", value: formatCompactNumber(data.support.messages24h), sub: "across all threads", icon: Inbox, color: "text-primary" },
    { label: "Published Games", value: data.catalog.publishedGames, sub: "live in catalog", icon: Gamepad2, color: "text-secondary", href: "/admin/games" },
    { label: "Tournaments", value: data.catalog.liveTournaments + data.catalog.openTournaments, sub: `${data.catalog.liveTournaments} live now`, icon: Trophy, color: "text-accent", href: "/admin/tournaments" },
    { label: "Coins in Circulation", value: formatCompactNumber(data.economy.coinsInCirculation), sub: `${data.economy.spins24h} spins today`, icon: Coins, color: "text-accent", href: "/admin/rewards" },
    { label: "Redemptions (24h)", value: data.economy.redemptions24h, sub: "store activity", icon: Activity, color: "text-primary" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Control Center</h1>
          <p className="text-sm text-muted">Live platform overview. Auto-refreshes every 30 seconds.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-muted transition-colors hover:text-white"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4",
                alert.level === "critical" ? "border-danger/30 bg-danger/10" : "border-accent/30 bg-accent/10"
              )}
            >
              <AlertTriangle className={cn("h-5 w-5 shrink-0", alert.level === "critical" ? "text-danger" : "text-accent")} />
              <p className="text-sm text-white">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* System banner */}
      <div
        className={cn(
          "mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5",
          healthy ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"
        )}
      >
        <div className="flex items-center gap-3">
          {healthy ? <CheckCircle2 className="h-7 w-7 text-success" /> : <AlertTriangle className="h-7 w-7 text-danger" />}
          <div>
            <p className="font-display font-bold text-white">
              {healthy ? "All Systems Operational" : "Degraded Service"}
            </p>
            <p className="text-sm text-muted">
              {data.system.environment} · uptime {formatUptime(data.system.uptime)} · {data.system.queuePending} jobs queued
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(data.system.checks).map(([key, probe]) => (
            <span
              key={key}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize",
                probe.status === "up"
                  ? "border-success/30 text-success"
                  : probe.status === "down"
                    ? "border-danger/30 text-danger"
                    : "border-white/10 text-muted"
              )}
              title={probe.detail}
            >
              {key}
              {probe.latencyMs !== undefined && ` · ${probe.latencyMs}ms`}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Card = (
            <GlassPanel className="h-full p-5 transition-colors hover:border-primary/30">
              <div className="flex items-start justify-between">
                <span className="text-xs text-muted">{stat.label}</span>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted">{stat.sub}</p>
            </GlassPanel>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>
              {Card}
            </Link>
          ) : (
            <div key={stat.label}>{Card}</div>
          );
        })}
      </div>

      {/* Recent admin actions */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Recent Admin Activity</h2>
        {data.recentAdminActions.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <Activity className="mx-auto mb-2 h-6 w-6 text-muted" />
            <p className="text-sm text-muted">No admin actions recorded this week.</p>
          </GlassPanel>
        ) : (
          <GlassPanel className="divide-y divide-white/5">
            {data.recentAdminActions.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{log.action.replace(/[._]/g, " ")}</p>
                  <p className="text-xs text-muted">
                    {log.actor ? `${log.actor.username} · ${log.actor.role.toLowerCase().replace("_", " ")}` : "system"} ·{" "}
                    {log.entityType}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
          </GlassPanel>
        )}
      </div>

      {lastChecked && (
        <p className="mt-4 text-center text-xs text-muted">Last updated {lastChecked.toLocaleTimeString()}</p>
      )}
    </div>
  );
}
