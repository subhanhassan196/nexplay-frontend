import { api } from "@/lib/api/axios";
import type {
  ConversationDTO,
  MessageDTO,
  QuickLinkDTO,
  AnnouncementDTO,
  QuickLinkCategory,
  ConversationState,
} from "@/lib/api/messenger";

export interface AdminConversationDTO extends ConversationDTO {
  user: { id: string; username: string; email: string; avatarUrl: string | null };
  assignedAgent: { id: string; username: string; avatarUrl: string | null } | null;
  ticketNumber: number;
  /// The game the user most recently opened support from.
  lastGameSlug: string | null;
  lastGameTitle: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  tags: string[];
  resolutionNotes: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
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

export interface AdminAnnouncementDTO extends AnnouncementDTO {
  isActive: boolean;
  expiresAt: string | null;
}

export const adminSupportApi = {
  // Conversations
  listConversations: (params?: {
    page?: number;
    limit?: number;
    state?: ConversationState;
    search?: string;
    priority?: string;
    assignment?: "assigned" | "unassigned";
    sort?: "newest" | "oldest" | "priority" | "waiting";
  }) =>
    api.get<Paginated<AdminConversationDTO>>("/admin/support/conversations", { params }),
  getConversation: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<Envelope<{ conversation: AdminConversationDTO; messages: MessageDTO[]; pagination: unknown }>>(
      `/admin/support/conversations/${id}`,
      { params }
    ),
  reply: (id: string, content: string, attachmentUrls?: string[]) =>
    api.post<Envelope<{ message: MessageDTO }>>(`/admin/support/conversations/${id}/reply`, { content, attachmentUrls }),
  setState: (id: string, state: ConversationState) =>
    api.patch<Envelope<{ conversation: AdminConversationDTO }>>(`/admin/support/conversations/${id}/state`, { state }),
  assign: (id: string, agentId: string | null) =>
    api.patch<Envelope<{ conversation: AdminConversationDTO }>>(`/admin/support/conversations/${id}/assign`, { agentId }),
  setPinned: (id: string, isPinned: boolean) =>
    api.patch<Envelope<{ conversation: AdminConversationDTO }>>(`/admin/support/conversations/${id}/pin`, { isPinned }),
  updateTicket: (id: string, data: { priority?: string; category?: string; tags?: string[]; resolutionNotes?: string }) =>
    api.patch<Envelope<{ conversation: AdminConversationDTO }>>(`/admin/support/conversations/${id}/ticket`, data),
  deleteConversation: (id: string) => api.delete<Envelope<object>>(`/admin/support/conversations/${id}`),

  // Quick links
  listQuickLinks: () => api.get<Envelope<{ quickLinks: QuickLinkDTO[] }>>("/admin/support/quick-links"),
  createQuickLink: (data: { category: QuickLinkCategory; label: string; url: string; iconName?: string; description?: string; order?: number }) =>
    api.post<Envelope<{ quickLink: QuickLinkDTO }>>("/admin/support/quick-links", data),
  updateQuickLink: (id: string, data: Partial<QuickLinkDTO>) =>
    api.patch<Envelope<{ quickLink: QuickLinkDTO }>>(`/admin/support/quick-links/${id}`, data),
  deleteQuickLink: (id: string) => api.delete<Envelope<object>>(`/admin/support/quick-links/${id}`),

  // Announcements
  listAnnouncements: () => api.get<Envelope<{ announcements: AdminAnnouncementDTO[] }>>("/admin/support/announcements"),
  createAnnouncement: (data: { title: string; body: string; expiresAt?: string }) =>
    api.post<Envelope<{ announcement: AdminAnnouncementDTO }>>("/admin/support/announcements", data),
  updateAnnouncement: (id: string, data: { title?: string; body?: string; isActive?: boolean; expiresAt?: string | null }) =>
    api.patch<Envelope<{ announcement: AdminAnnouncementDTO }>>(`/admin/support/announcements/${id}`, data),
  deleteAnnouncement: (id: string) => api.delete<Envelope<object>>(`/admin/support/announcements/${id}`),

  // Settings
  getSettings: () => api.get<Envelope<{ settings: Record<string, string> }>>("/admin/support/settings"),
  updateSetting: (key: string, value: string) =>
    api.patch<Envelope<{ key: string; value: string }>>("/admin/support/settings", { key, value }),
};
