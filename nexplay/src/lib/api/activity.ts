import { api } from "@/lib/api/axios";

export interface ActivityDTO {
  id: string;
  actorId: string | null;
  actor: { id: string; username: string; role: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface Paginated<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const activityApi = {
  list: (params?: { page?: number; limit?: number; action?: string; entityType?: string }) =>
    api.get<Paginated<ActivityDTO>>("/admin/activity", { params }),
};
