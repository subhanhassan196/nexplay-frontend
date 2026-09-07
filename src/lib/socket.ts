"use client";

import { io, type Socket } from "socket.io-client";

// Mirror of the server's SOCKET_EVENTS contract.
export const SOCKET_EVENTS = {
  JOIN_CONVERSATION: "conversation:join",
  LEAVE_CONVERSATION: "conversation:leave",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_READ: "message:read",
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_STATUS: "message:status",
  TYPING: "typing",
  PRESENCE: "presence",
  CONVERSATION_UPDATED: "conversation:updated",
  NOTIFICATION_NEW: "notification:new",
  SUPPORT_SETTINGS: "support:settings",
} as const;

// The socket connects to the API origin (not the /api/v1 path). Mirrors
// axios's host auto-detection so IP access works on other devices.
function resolveSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
}

const SOCKET_URL = resolveSocketUrl();

let socket: Socket | null = null;

/**
 * Returns the shared socket instance, creating it on first use.
 * `withCredentials` sends the httpOnly auth cookie in the handshake, so
 * no token needs to be handled in JS. Auto-reconnect is on by default
 * in socket.io-client; we surface connect/disconnect via the hook.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
