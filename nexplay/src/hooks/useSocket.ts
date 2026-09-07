"use client";

import { useEffect, useState } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

/**
 * Connects the shared socket while the user is authenticated and
 * exposes connection status (for a reconnecting indicator). Disconnects
 * on logout. Safe to call from multiple components — the socket itself
 * is a singleton, this hook just reflects/manages its lifecycle.
 */
export function useSocket() {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };
    const onDisconnect = () => setIsConnected(false);
    const onReconnectAttempt = () => setIsReconnecting(true);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onConnect);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onConnect);
    };
  }, [isAuthenticated]);

  return { isConnected, isReconnecting };
}
