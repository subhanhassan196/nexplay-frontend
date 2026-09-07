import { api } from "@/lib/api/axios";

export interface SearchResults {
  users: { id: string; username: string; email: string; role: string }[];
  tickets: { id: string; ticketNumber: number; state: string; priority: string; user: { username: string } }[];
  messages: { id: string; content: string; conversationId: string; senderType: string; createdAt: string }[];
  games: { id: string; slug: string; title: string; coverImageUrl: string | null }[];
  announcements: { id: string; title: string; body: string; isActive: boolean }[];
}

export interface AgentDTO {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const searchApi = {
  global: (q: string) => api.get<Envelope<SearchResults>>("/admin/search", { params: { q } }),
};

export const agentsApi = {
  list: () => api.get<Envelope<{ agents: AgentDTO[] }>>("/admin/support/agents"),
};

export const bulkApi = {
  setState: (conversationIds: string[], state: string) =>
    api.post<Envelope<{ count: number }>>("/admin/support/conversations/bulk/state", { conversationIds, state }),
  assign: (conversationIds: string[], agentId: string | null) =>
    api.post<Envelope<{ count: number }>>("/admin/support/conversations/bulk/assign", { conversationIds, agentId }),
};
