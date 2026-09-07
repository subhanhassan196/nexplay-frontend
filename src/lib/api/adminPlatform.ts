import { api } from "@/lib/api/axios";

export interface AdminUserDTO {
  id: string;
  username: string;
  email: string;
  role: "PLAYER" | "SUPPORT_AGENT" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  accountStatus: "ACTIVE" | "SUSPENDED" | "BANNED";
  isEmailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PermissionsDTO {
  role: string;
  baseline: string[];
  effective: string[];
  overrides: { id: string; permission: string; granted: boolean }[];
  catalogue: string[];
}

export interface WheelSegmentAdminDTO {
  id: string;
  label: string;
  rewardType: string;
  coinAmount: number;
  color: string;
  weight: number;
  order: number;
  isActive: boolean;
}

export interface DailyConfigDTO {
  id: string;
  dayNumber: number;
  label: string;
  rewardType: string;
  coinAmount: number;
  isActive: boolean;
}

export interface AdminStoreItemDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  rarity: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  price: number;
  stock: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  order: number;
}

export interface ControlCenterDTO {
  users: { total: number; new24h: number; activeSessions: number };
  support: { open: number; pending: number; unassigned: number; messages24h: number };
  catalog: { publishedGames: number; liveTournaments: number; openTournaments: number };
  economy: { spins24h: number; redemptions24h: number; coinsInCirculation: number };
  system: {
    status: string;
    uptime: number;
    environment: string;
    checks: Record<string, { status: string; latencyMs?: number; detail?: string }>;
    queuePending: number;
  };
  recentAdminActions: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { id: string; username: string; role: string } | null;
  }[];
  alerts: { level: "warning" | "critical"; message: string }[];
  generatedAt: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const adminPlatformApi = {
  controlCenter: () => api.get<Envelope<ControlCenterDTO>>("/admin/platform/control-center"),

  listUsers: (params?: { search?: string; role?: string; staffOnly?: boolean; take?: number }) =>
    api.get<Envelope<{ items: AdminUserDTO[]; total: number }>>("/admin/platform/users", { params }),
  setRole: (id: string, role: string) =>
    api.patch<Envelope<{ user: AdminUserDTO }>>(`/admin/platform/users/${id}/role`, { role }),
  setStatus: (id: string, status: string) =>
    api.patch<Envelope<{ user: AdminUserDTO }>>(`/admin/platform/users/${id}/status`, { status }),

  getPermissions: (id: string) => api.get<Envelope<PermissionsDTO>>(`/admin/platform/users/${id}/permissions`),
  setPermission: (id: string, permission: string, granted: boolean) =>
    api.put<Envelope<object>>(`/admin/platform/users/${id}/permissions`, { permission, granted }),
  clearPermission: (id: string, permission: string) =>
    api.delete<Envelope<object>>(`/admin/platform/users/${id}/permissions`, { data: { permission } }),

  // Rewards config
  listSegments: () => api.get<Envelope<{ segments: WheelSegmentAdminDTO[] }>>("/admin/platform/rewards/wheel"),
  createSegment: (data: Partial<WheelSegmentAdminDTO>) =>
    api.post<Envelope<{ segment: WheelSegmentAdminDTO }>>("/admin/platform/rewards/wheel", data),
  updateSegment: (id: string, data: Partial<WheelSegmentAdminDTO>) =>
    api.patch<Envelope<{ segment: WheelSegmentAdminDTO }>>(`/admin/platform/rewards/wheel/${id}`, data),
  deleteSegment: (id: string) => api.delete<Envelope<object>>(`/admin/platform/rewards/wheel/${id}`),

  listDaily: () => api.get<Envelope<{ config: DailyConfigDTO[] }>>("/admin/platform/rewards/daily"),
  upsertDaily: (data: Partial<DailyConfigDTO> & { dayNumber: number }) =>
    api.put<Envelope<{ config: DailyConfigDTO }>>("/admin/platform/rewards/daily", data),
  deleteDaily: (id: string) => api.delete<Envelope<object>>(`/admin/platform/rewards/daily/${id}`),

  listStore: () => api.get<Envelope<{ items: AdminStoreItemDTO[] }>>("/admin/platform/rewards/store"),
  createStoreItem: (data: Partial<AdminStoreItemDTO>) =>
    api.post<Envelope<{ item: AdminStoreItemDTO }>>("/admin/platform/rewards/store", data),
  updateStoreItem: (id: string, data: Partial<AdminStoreItemDTO>) =>
    api.patch<Envelope<{ item: AdminStoreItemDTO }>>(`/admin/platform/rewards/store/${id}`, data),
  deleteStoreItem: (id: string) => api.delete<Envelope<object>>(`/admin/platform/rewards/store/${id}`),
  recentRedemptions: () =>
    api.get<Envelope<{ items: { id: string; pricePaid: number; createdAt: string; item: { name: string; rarity: string }; user: { username: string } }[] }>>(
      "/admin/platform/rewards/redemptions"
    ),
};
