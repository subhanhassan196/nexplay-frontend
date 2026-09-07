"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Zap, ListTodo, HardDrive, RefreshCw, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { healthApi, type HealthReport, type HealthProbe } from "@/lib/api/health";
import { cn } from "@/lib/utils";

const PROBE_META: Record<string, { label: string; icon: typeof Database }> = {
  database: { label: "Database", icon: Database },
  cache: { label: "Cache (Redis)", icon: Zap },
  queue: { label: "Job Queue", icon: ListTodo },
  storage: { label: "Storage", icon: HardDrive },
};

function StatusIcon({ status }: { status: HealthProbe["status"] }) {
  if (status === "up") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === "down") return <XCircle className="h-5 w-5 text-danger" />;
  return <MinusCircle className="h-5 w-5 text-muted" />;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AdminHealthPage() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await healthApi.detailed();
      setReport(data);
      setLastChecked(new Date());
    } catch {
      // Even a 503 returns a body; only true network errors land here.
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">System Health</h1>
          <p className="text-sm text-muted">Live status of every subsystem. Auto-refreshes every 15s.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-muted hover:text-white"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
        </button>
      </div>

      {report && (
        <>
          {/* Overall banner */}
          <div
            className={cn(
              "mb-6 flex items-center gap-3 rounded-2xl border p-5",
              report.status === "healthy" ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"
            )}
          >
            {report.status === "healthy" ? (
              <CheckCircle2 className="h-8 w-8 text-success" />
            ) : (
              <XCircle className="h-8 w-8 text-danger" />
            )}
            <div>
              <p className="font-display text-lg font-bold text-white">
                {report.status === "healthy" ? "All Systems Operational" : "Degraded Service"}
              </p>
              <p className="text-sm text-muted">
                {report.environment} · uptime {formatUptime(report.uptime)} · v{report.version}
              </p>
            </div>
          </div>

          {/* Subsystem cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(report.checks).map(([key, probe]) => {
              const meta = PROBE_META[key] ?? { label: key, icon: Database };
              const Icon = meta.icon;
              return (
                <div key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface/40 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-white">{meta.label}</p>
                      <p className="text-xs text-muted">
                        {probe.detail || probe.status}
                        {probe.latencyMs !== undefined && ` · ${probe.latencyMs}ms`}
                      </p>
                    </div>
                  </div>
                  <StatusIcon status={probe.status} />
                </div>
              );
            })}
          </div>

          {lastChecked && (
            <p className="mt-4 text-center text-xs text-muted">Last checked {lastChecked.toLocaleTimeString()}</p>
          )}
        </>
      )}

      {isLoading && !report && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {!isLoading && !report && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center">
          <XCircle className="mx-auto mb-2 h-8 w-8 text-danger" />
          <p className="text-sm text-white">Could not reach the API health endpoint.</p>
        </div>
      )}
    </div>
  );
}
