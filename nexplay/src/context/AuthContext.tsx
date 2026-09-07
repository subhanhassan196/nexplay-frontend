"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Wraps the app once (root layout) and hydrates the current user from
 * the httpOnly access-token cookie on first mount. Every protected UI
 * (Navbar avatar, Dashboard, middleware-gated pages) reads from this
 * single source of truth instead of re-fetching independently.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await refetchUser();
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refetchUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(getApiErrorMessage(err));
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: Boolean(user), refetchUser, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
