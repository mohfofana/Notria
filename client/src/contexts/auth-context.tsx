"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, setAccessToken } from "@/lib/api";

type UserRole = "student" | "parent" | "admin";

interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: "student" | "parent";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session on mount via refresh token cookie
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { data } = await api.post("/auth/refresh");
        if (cancelled) return;
        setAccessToken(data.accessToken);

        const { data: meData } = await api.get("/auth/me");
        if (cancelled) return;
        setUser(meData.user);
      } catch {
        // No valid session, stay logged out
        setAccessToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const { data } = await api.post("/auth/login", { phone, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    const { data } = await api.post("/auth/register", registerData);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Continue even if server call fails
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
