"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessagesSquare, CircleDot, CheckCircle2, Archive, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { adminSupportApi, type AdminConversationDTO } from "@/lib/api/adminSupport";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: number;
  icon: typeof MessagesSquare;
  accent: string;
}

export default function AdminOverviewPage() {
  const [conversations, setConversations] = useState<AdminConversationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await adminSupportApi.listConversations({ limit: 100 });
        if (!cancelled) setConversations(data.data);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats: StatCard[] = useMemo(() => {
    const byState = (s: string) => conversations.filter((c) => c.state === s).length;
    return [
      { label: "Total", value: conversations.length, icon: MessagesSquare, accent: "text-primary" },
      { label: "Open", value: byState("OPEN"), icon: CircleDot, accent: "text-success" },
      { label: "Resolved", value: byState("RESOLVED"), icon: CheckCircle2, accent: "text-secondary" },
      { label: "Archived", value: byState("ARCHIVED"), icon: Archive, accent: "text-muted" },
    ];
  }, [conversations]);

  // Group conversations by day (last 7 days) for the area chart.
  const activityData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { weekday: "short" });
      const count = conversations.filter((c) => new Date(c.lastMessageAt).toDateString() === d.toDateString()).length;
      days.push({ label, count });
    }
    return days;
  }, [conversations]);

  const stateData = useMemo(
    () =>
      ["OPEN", "PENDING", "RESOLVED", "ARCHIVED"].map((s) => ({
        state: s.charAt(0) + s.slice(1).toLowerCase(),
        count: conversations.filter((c) => c.state === s).length,
      })),
    [conversations]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Support Overview</h1>
        <p className="text-sm text-muted">Live snapshot of your support operations.</p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/10 bg-surface/40 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-white/5", stat.accent)}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-white">{isLoading ? "—" : stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-surface/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold text-white">Activity (7 days)</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
              />
              <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fill="url(#activityGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface/40 p-6 backdrop-blur-sm">
          <h2 className="mb-4 font-display text-sm font-semibold text-white">By Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="state" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
              />
              <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
