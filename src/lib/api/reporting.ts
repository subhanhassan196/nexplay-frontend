import { api } from "@/lib/api/axios";

export interface ReportOverview {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  archived: number;
  newInRange: number;
  resolvedInRange: number;
  avgResolutionHours: number;
  totalMessages: number;
  agentMessages: number;
}

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface AgentPerf {
  agentId: string;
  username: string;
  replies: number;
  resolved: number;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const reportingApi = {
  overview: (days: number) => api.get<Envelope<ReportOverview>>("/admin/reports/overview", { params: { days } }),
  trends: (days: number) => api.get<Envelope<{ trends: TrendPoint[] }>>("/admin/reports/trends", { params: { days } }),
  breakdown: () => api.get<Envelope<{ byCategory: BreakdownItem[]; byPriority: BreakdownItem[] }>>("/admin/reports/breakdown"),
  agents: (days: number) => api.get<Envelope<{ agents: AgentPerf[] }>>("/admin/reports/agents", { params: { days } }),
};
