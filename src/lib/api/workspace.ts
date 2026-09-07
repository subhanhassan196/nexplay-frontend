import { api } from "@/lib/api/axios";

export interface InternalNoteDTO {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; role: string };
}

export interface CustomerTagDTO {
  id: string;
  slug: string;
  label: string;
  color: string;
  description: string | null;
  order: number;
  isActive: boolean;
  _count?: { assignments: number };
}

export interface TagAssignmentDTO {
  id: string;
  tagId: string;
  createdAt: string;
  tag: CustomerTagDTO;
}

export type FinancialType = "DEPOSIT" | "CASHOUT" | "ADJUSTMENT";

export interface FinancialRecordDTO {
  id: string;
  type: FinancialType;
  amountMinor: number;
  currency: string;
  note: string | null;
  recordedAt: string;
}

export interface FinancialSummaryDTO {
  depositMinor: number;
  cashoutMinor: number;
  netMinor: number;
  currency: string;
}

export interface MessageAuditDTO {
  id: string;
  messageId: string;
  originalContent: string;
  attachmentUrls: string[];
  deletedById: string | null;
  createdAt: string;
}

export type BroadcastStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

export interface BroadcastDTO {
  id: string;
  title: string;
  content: string;
  tagIds: string[];
  status: BroadcastStatus;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
}

export interface LoginRecordDTO {
  id: string;
  ipAddress: string | null;
  device: string | null;
  success: boolean;
  createdAt: string;
}

export interface RelatedAccountDTO {
  user: { id: string; username: string; email: string; accountStatus: string; createdAt: string };
  sharedIpCount: number;
  sharedDeviceCount: number;
  confidence: "low" | "medium" | "high";
  reasons: string[];
  lastSeenTogether: string;
}

export interface AgentLinkDTO {
  id: string;
  slug: string;
  isActive: boolean;
  visitCount: number;
  agent?: { id: string; username: string; role: string };
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const workspaceApi = {
  // Internal notes — never shown to customers.
  listNotes: (conversationId: string) =>
    api.get<Envelope<{ notes: InternalNoteDTO[] }>>(`/admin/workspace/conversations/${conversationId}/notes`),
  addNote: (conversationId: string, content: string) =>
    api.post<Envelope<{ note: InternalNoteDTO }>>(`/admin/workspace/conversations/${conversationId}/notes`, { content }),
  deleteNote: (noteId: string) => api.delete<Envelope<object>>(`/admin/workspace/notes/${noteId}`),

  // Deleted-message audit
  listAudits: (conversationId: string) =>
    api.get<Envelope<{ audits: MessageAuditDTO[] }>>(`/admin/workspace/conversations/${conversationId}/audit`),

  // Tags
  listTags: (includeInactive?: boolean) =>
    api.get<Envelope<{ tags: CustomerTagDTO[] }>>("/admin/workspace/tags", { params: { includeInactive } }),
  createTag: (data: Partial<CustomerTagDTO>) =>
    api.post<Envelope<{ tag: CustomerTagDTO }>>("/admin/workspace/tags", data),
  updateTag: (id: string, data: Partial<CustomerTagDTO>) =>
    api.patch<Envelope<{ tag: CustomerTagDTO }>>(`/admin/workspace/tags/${id}`, data),
  deleteTag: (id: string) => api.delete<Envelope<object>>(`/admin/workspace/tags/${id}`),

  getUserTags: (userId: string) =>
    api.get<Envelope<{ tags: TagAssignmentDTO[] }>>(`/admin/workspace/customers/${userId}/tags`),
  toggleUserTag: (userId: string, tagId: string) =>
    api.post<Envelope<{ assigned: boolean }>>(`/admin/workspace/customers/${userId}/tags`, { tagId }),

  // Broadcasts
  listBroadcasts: () => api.get<Envelope<{ broadcasts: BroadcastDTO[] }>>("/admin/workspace/broadcasts"),
  previewAudience: (tagIds: string[]) =>
    api.post<Envelope<{ count: number }>>("/admin/workspace/broadcasts/audience", { tagIds }),
  createBroadcast: (data: { title: string; content: string; tagIds?: string[] }) =>
    api.post<Envelope<{ broadcast: BroadcastDTO }>>("/admin/workspace/broadcasts", data),
  updateBroadcast: (id: string, data: Partial<BroadcastDTO>) =>
    api.patch<Envelope<{ broadcast: BroadcastDTO }>>(`/admin/workspace/broadcasts/${id}`, data),
  deleteBroadcast: (id: string) => api.delete<Envelope<object>>(`/admin/workspace/broadcasts/${id}`),
  sendBroadcast: (id: string) =>
    api.post<Envelope<{ broadcast: BroadcastDTO }>>(`/admin/workspace/broadcasts/${id}/send`),

  // Account security
  loginHistory: (userId: string) =>
    api.get<Envelope<{ history: LoginRecordDTO[] }>>(`/admin/workspace/customers/${userId}/logins`),
  relatedAccounts: (userId: string) =>
    api.get<Envelope<{ related: RelatedAccountDTO[]; checkedIps: number }>>(
      `/admin/workspace/customers/${userId}/related`
    ),

  // Agent links
  myAgentLink: () => api.get<Envelope<{ link: AgentLinkDTO }>>("/admin/workspace/my-link"),
  listAgentLinks: () => api.get<Envelope<{ links: AgentLinkDTO[] }>>("/admin/workspace/agent-links"),
  setAgentLinkActive: (agentId: string, isActive: boolean) =>
    api.patch<Envelope<{ link: AgentLinkDTO }>>(`/admin/workspace/agent-links/${agentId}`, { isActive }),

  // Financials
  getFinancials: (userId: string) =>
    api.get<Envelope<{ records: FinancialRecordDTO[]; summary: FinancialSummaryDTO }>>(
      `/admin/workspace/customers/${userId}/financials`
    ),
  addFinancial: (userId: string, data: { type: FinancialType; amountMinor: number; note?: string }) =>
    api.post<Envelope<{ record: FinancialRecordDTO }>>(`/admin/workspace/customers/${userId}/financials`, data),
  deleteFinancial: (id: string) => api.delete<Envelope<object>>(`/admin/workspace/financials/${id}`),
};

/** Minor units (paisa) → readable amount. */
export function formatMinor(minor: number, currency = "PKR"): string {
  return `${currency} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
