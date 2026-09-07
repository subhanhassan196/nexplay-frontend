"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { messengerApi, type MessageDTO, type BootstrapDTO, type ConversationState } from "@/lib/api/messenger";
import { useAuth } from "@/context/AuthContext";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";

export type MessengerSize = "small" | "medium" | "large";

interface MessengerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  size: MessengerSize;
  setSize: (size: MessengerSize) => void;

  messages: MessageDTO[];
  bootstrap: BootstrapDTO | null;
  conversationState: ConversationState | null;
  unreadCount: number;
  isLoading: boolean;
  isSending: boolean;
  isAgentTyping: boolean;
  emitTyping: (typing: boolean) => void;

  /// The game the user opened support from, if any. Context only — the
  /// conversation itself stays global (one thread per user).
  gameContext: GameContext | null;
  setGameContext: (ctx: GameContext | null) => void;
  openWithGame: (ctx: GameContext) => void;

  sendMessage: (content: string, replyToId?: string, attachmentUrls?: string[]) => Promise<void>;
  uploadAttachment: (file: File) => Promise<string>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string, add: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface GameContext {
  slug: string;
  title: string;
  logoUrl?: string | null;
}

const MessengerContext = createContext<MessengerContextValue | null>(null);

const SIZE_STORAGE_KEY = "nexplay:messenger-size";

export function MessengerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [gameContext, setGameContext] = useState<GameContext | null>(null);
  const [size, setSizeState] = useState<MessengerSize>(() => {
    if (typeof window === "undefined") return "medium";
    return (window.localStorage.getItem(SIZE_STORAGE_KEY) as MessengerSize | null) ?? "medium";
  });
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [bootstrap, setBootstrap] = useState<BootstrapDTO | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const hasLoadedRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSize = useCallback((next: MessengerSize) => {
    setSizeState(next);
    window.localStorage.setItem(SIZE_STORAGE_KEY, next);
  }, []);

  const loadConversation = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [bootstrapRes, messagesRes] = await Promise.all([
        messengerApi.bootstrap(),
        messengerApi.getMessages({ limit: 100 }),
      ]);
      setBootstrap(bootstrapRes.data.data);
      setMessages(messagesRes.data.data.messages);
      setConversationState(messagesRes.data.data.conversation.state);

      const conversationId = messagesRes.data.data.conversation.id;
      conversationIdRef.current = conversationId;
      // Join the conversation's socket room for live messages/typing.
      getSocket().emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);
    } catch {
      // Non-fatal — messenger just shows empty until retry.
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await messengerApi.getConversation();
      setUnreadCount(data.data.unreadCount);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  // Real-time: listen for new/updated messages, typing, and refresh unread.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setMessages([]);
      hasLoadedRef.current = false;
      conversationIdRef.current = null;
      return;
    }

    // Prime unread count once on login.
    refreshUnread();

    const socket = getSocket();

    const handleNewMessage = (payload: { conversationId: string; message: MessageDTO }) => {
      // Only messages for our own conversation matter on the user side.
      if (conversationIdRef.current && payload.conversationId !== conversationIdRef.current) return;

      setMessages((prev) => {
        // Avoid duplicating our own just-sent message (already added optimistically).
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });

      // If the message is from the agent and the panel is closed, bump unread.
      if (payload.message.senderType !== "USER") {
        setIsAgentTyping(false);
        setUnreadCount((c) => c + 1);
        // Acknowledge delivery back to the server.
        socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
          messageId: payload.message.id,
          conversationId: payload.conversationId,
        });
      }
    };

    const handleUpdatedMessage = (payload: { conversationId: string; message: MessageDTO }) => {
      setMessages((prev) => prev.map((m) => (m.id === payload.message.id ? payload.message : m)));
    };

    const handleTyping = (payload: { conversationId: string; typing: boolean }) => {
      if (conversationIdRef.current && payload.conversationId === conversationIdRef.current) {
        setIsAgentTyping(payload.typing);
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleUpdatedMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleUpdatedMessage);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
    };
  }, [isAuthenticated, refreshUnread]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void loadConversation();
    }
    // Mark read on open
    void messengerApi.markRead().then(() => setUnreadCount(0)).catch(() => undefined);
  }, [loadConversation]);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => (isOpen ? close() : open()), [isOpen, open, close]);

  /// Opens the messenger already scoped to a game — used by the
  /// "Access & Support" button on every game detail page.
  const openWithGame = useCallback(
    (ctx: GameContext) => {
      setGameContext(ctx);
      open();
    },
    [open]
  );

  const sendMessage = useCallback(
    async (content: string, replyToId?: string, attachmentUrls?: string[]) => {
      setIsSending(true);
      try {
        const { data } = await messengerApi.sendMessage(content, replyToId, attachmentUrls, gameContext ?? undefined);
        setMessages((prev) => [...prev, data.data.message]);
        setConversationState("OPEN");
      } finally {
        setIsSending(false);
      }
    },
    [gameContext]
  );

  /// Uploads an image and returns its URL, ready to attach to a message.
  const uploadAttachment = useCallback(async (file: File) => {
    const { data } = await messengerApi.uploadAttachment(file);
    return data.data.url;
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    const { data } = await messengerApi.editMessage(messageId, content);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? data.data.message : m)));
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const { data } = await messengerApi.deleteMessage(messageId);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? data.data.message : m)));
  }, []);

  const toggleReaction = useCallback(async (messageId: string, emoji: string, add: boolean) => {
    const { data } = await messengerApi.react(messageId, emoji, add);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? data.data.message : m)));
  }, []);

  const emitTyping = useCallback((typing: boolean) => {
    const conversationId = conversationIdRef.current;
    if (!conversationId) return;
    const socket = getSocket();
    socket.emit(typing ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP, conversationId);

    // Auto-stop after inactivity so a stuck "typing" never lingers.
    if (typing) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit(SOCKET_EVENTS.TYPING_STOP, conversationId);
      }, 3000);
    }
  }, []);

  const value: MessengerContextValue = {
    isOpen,
    open,
    close,
    toggle,
    size,
    setSize,
    messages,
    bootstrap,
    conversationState,
    unreadCount,
    isLoading,
    isSending,
    isAgentTyping,
    emitTyping,
    gameContext,
    setGameContext,
    openWithGame,
    sendMessage,
    uploadAttachment,
    editMessage,
    deleteMessage,
    toggleReaction,
    refresh: loadConversation,
  };

  return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>;
}

export function useMessenger() {
  const ctx = useContext(MessengerContext);
  if (!ctx) throw new Error("useMessenger must be used within MessengerProvider");
  return ctx;
}
