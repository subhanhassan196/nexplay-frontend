import { api } from "@/lib/api/axios";

export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "NEW_FOLLOWER"
  | "ACHIEVEMENT_UNLOCKED"
  | "BADGE_EARNED"
  | "TOURNAMENT_INVITE"
  | "TOURNAMENT_STARTING"
  | "TOURNAMENT_RESULT"
  | "LEADERBOARD_RANK_CHANGE"
  | "COMMUNITY_COMMENT"
  | "COMMUNITY_LIKE"
  | "COMMUNITY_MENTION"
  | "SUPPORT_REPLY"
  | "ANNOUNCEMENT"
  | "SYSTEM";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<Envelope<{ items: NotificationDTO[]; unreadCount: number; pagination: unknown }>>("/notifications", { params }),
  unreadCount: () => api.get<Envelope<{ count: number }>>("/notifications/unread-count"),
  markRead: (id: string) => api.patch<Envelope<object>>(`/notifications/${id}/read`),
  markAllRead: () => api.post<Envelope<object>>("/notifications/read-all"),
  delete: (id: string) => api.delete<Envelope<object>>(`/notifications/${id}`),
  clearRead: () => api.delete<Envelope<object>>("/notifications/clear-read"),
};
