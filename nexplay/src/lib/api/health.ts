import { api } from "@/lib/api/axios";

export interface HealthProbe {
  status: "up" | "down" | "disabled";
  latencyMs?: number;
  detail?: string;
}

export interface HealthReport {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthProbe;
    cache: HealthProbe;
    queue: HealthProbe;
    storage: HealthProbe;
  };
}

export const healthApi = {
  // Note: health endpoints live at the API root, not behind a resource path.
  detailed: () => api.get<HealthReport>("/health/detailed"),
};
