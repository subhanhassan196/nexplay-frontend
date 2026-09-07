import { api } from "@/lib/api/axios";

export type MessageSenderType = "USER" | "AGENT" | "SYSTEM" | "BOT";
export type ConversationState = "OPEN" | "PENDING" | "RESOLVED" | "ARCHIVED";
export type QuickLinkCategory =
  | "FEATURED_GAME"
  | "TRENDING_GAME"
  | "REWARD"
  | "TOURNAMENT"
  | "CASINO"
  | "POKER"
  | "ROULETTE"
  | "BLACKJACK"
  | "SLOTS"
  | "GENERAL";

export interface MessageSender {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId: string | null;
  sender: MessageSender | null;
  content: string;
  attachmentUrls: string[];
  /// Structured attachments — images, documents and voice notes, each
  /// with the metadata the UI needs to render the right player/preview.
  attachments: {
    id: string;
    kind: "IMAGE" | "DOCUMENT" | "VOICE";
    url: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number | null;
    width?: number | null;
    height?: number | null;
  }[];
  /// Which game the user was viewing when this message was sent.
  gameSlug: string | null;
  gameTitle: string | null;
  replyToId: string | null;
  replyTo: { id: string; content: string; senderType: MessageSenderType; deletedAt: string | null; sender: MessageSender | null } | null;
  reactions: MessageReaction[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  userId: string;
  state: ConversationState;
  assignedAgentId: string | null;
  isPinned: boolean;
  subject: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  createdAt: string;
}

export interface QuickLinkDTO {
  id: string;
  category: QuickLinkCategory;
  label: string;
  url: string;
  iconName: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
}

export interface AnnouncementDTO {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
}

export interface BootstrapDTO {
  welcomeMessage: string;
  supportHours: string;
  isOnline: boolean;
  offlineMessage: string;
  quickLinks: QuickLinkDTO[];
  announcements: AnnouncementDTO[];
}

/** The agent currently handling the customer's thread, if assigned. */
export interface AssignedAgentDTO {
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface UploadedAttachment {
  kind: "IMAGE" | "DOCUMENT" | "VOICE";
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const messengerApi = {
  bootstrap: () => api.get<Envelope<BootstrapDTO>>("/messenger/bootstrap"),
  getConversation: () =>
    api.get<Envelope<{ conversation: ConversationDTO; unreadCount: number; agent: AssignedAgentDTO | null }>>(
      "/messenger/conversation"
    ),
  getMessages: (params?: { page?: number; limit?: number }) =>
    api.get<Envelope<{ conversation: ConversationDTO; messages: MessageDTO[]; pagination: unknown }>>("/messenger/messages", { params }),
  sendMessage: (
    content: string,
    replyToId?: string,
    attachmentUrls?: string[],
    gameContext?: { slug: string; title: string },
    attachments?: UploadedAttachment[]
  ) =>
    api.post<Envelope<{ message: MessageDTO }>>("/messenger/messages", {
      content,
      replyToId,
      attachmentUrls,
      gameContext: gameContext ? { slug: gameContext.slug, title: gameContext.title } : undefined,
      attachments,
    }),

  /**
   * Uploads one chat file and returns its metadata. Sending is a separate
   * call, so an abandoned upload never creates a message.
   */
  uploadFile: (file: File, durationSeconds?: number) => {
    const form = new FormData();
    form.append("file", file);
    if (durationSeconds !== undefined) form.append("durationSeconds", String(Math.round(durationSeconds)));
    return api.post<Envelope<{ attachment: UploadedAttachment }>>("/messenger/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /// Uploads a chat image, returning the stored URL to attach to a message.
  uploadAttachment: (file: File) => {
    const form = new FormData();
    form.append("attachment", file);
    return api.post<Envelope<{ url: string }>>("/messenger/attachments", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  editMessage: (messageId: string, content: string) =>
    api.patch<Envelope<{ message: MessageDTO }>>(`/messenger/messages/${messageId}`, { content }),
  deleteMessage: (messageId: string) =>
    api.delete<Envelope<{ message: MessageDTO }>>(`/messenger/messages/${messageId}`),
  react: (messageId: string, emoji: string, add: boolean) =>
    api.post<Envelope<{ message: MessageDTO }>>(`/messenger/messages/${messageId}/reactions`, { emoji, add }),
  markRead: () => api.post<Envelope<{ markedRead: number }>>("/messenger/read"),
};
