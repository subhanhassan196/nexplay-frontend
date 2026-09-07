"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { notificationApi, type NotificationDTO } from "@/lib/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";

interface NotificationContextValue {
  notifications: NotificationDTO[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const { data } = await notificationApi.list({ limit: 30 });
      setNotifications(data.data.items);
      setUnreadCount(data.data.unreadCount);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load + socket live push.
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();

    const socket = getSocket();
    const handleNew = (payload: { notification: NotificationDTO }) => {
      setNotifications((prev) => [payload.notification, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNew);
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNew);
    };
  }, [isAuthenticated, refresh]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await notificationApi.markRead(id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationApi.markAllRead().catch(() => undefined);
  }, []);

  const remove = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await notificationApi.delete(id).catch(() => undefined);
  }, []);

  const clearRead = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    await notificationApi.clearRead().catch(() => undefined);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        open,
        close,
        toggle,
        markRead,
        markAllRead,
        remove,
        clearRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
