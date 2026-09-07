"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Ticket, CheckCircle2, Clock, MessageSquare, TrendingUp } from "lucide-react";
import {
  reportingApi,
  type ReportOverview,
  type TrendPoint,
  type BreakdownItem,
  type AgentPerf,
} from "@/lib/api/reporting";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const PIE_COLORS = ["#7C3AED", "#06B6D4", "#F59E0B", "#22C55E", "#EF4444", "#EC4899", "#8B5CF6"];

export default function AdminReportsPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [byCategory, setByCategory] = useState<BreakdownItem[]>([]);
  const [byPriority, setByPriority] = useState<BreakdownItem[]>([]);
  const [agents, setAgents] = useState<AgentPerf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ov, tr, bd, ag] = await Promise.all([
        reportingApi.overview(days),
        reportingApi.trends(days),
        reportingApi.breakdown(),
        reportingApi.agents(days),
      ]);
      setOverview(ov.data.data);
      setTrends(tr.data.data.trends);
      setByCategory(bd.data.data.byCategory);
      setByPriority(bd.data.data.byPriority);
      setAgents(ag.data.data.agents);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = overview
    ? [
        { label: "Total Tickets", value: overview.total, icon: Ticket, color: "text-primary" },
        { label: "New (range)", value: overview.newInRange, icon: TrendingUp, color: "text-secondary" },
        { label: "Resolved (range)", value: overview.resolvedInRange, icon: CheckCircle2, color: "text-success" },
        { label: "Avg Resolution", value: `${overview.avgResolutionHours}h`, icon: Clock, color: "text-accent" },
        { label: "Agent Replies", value: overview.agentMessages, icon: MessageSquare, color: "text-primary" },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Reports & Analytics</h1>
          <p className="text-sm text-muted">Support performance and ticket insights.</p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                days === r.value ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{k.label}</span>
                  <k.icon className={cn("h-4 w-4", k.color)} />
                </div>
                <p className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-surface/40 p-5">
            <h2 className="mb-4 font-display text-sm font-semibold text-white">Tickets Over Time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="created" stroke="#7C3AED" fill="url(#createdGrad)" name="Created" />
                <Area type="monotone" dataKey="resolved" stroke="#22C55E" fill="url(#resolvedGrad)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdowns */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-surface/40 p-5">
              <h2 className="mb-4 font-display text-sm font-semibold text-white">By Category</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byCategory} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface/40 p-5">
              <h2 className="mb-4 font-display text-sm font-semibold text-white">By Priority</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent leaderboard */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-surface/40 p-5">
            <h2 className="mb-4 font-display text-sm font-semibold text-white">Agent Performance</h2>
            {agents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No agent activity in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-muted">
                      <th className="pb-2 pr-4">Agent</th>
                      <th className="pb-2 pr-4">Replies</th>
                      <th className="pb-2">Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a) => (
                      <tr key={a.agentId} className="border-b border-white/5">
                        <td className="py-2.5 pr-4 font-medium text-white">{a.username}</td>
                        <td className="py-2.5 pr-4 text-muted">{a.replies}</td>
                        <td className="py-2.5 text-muted">{a.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
