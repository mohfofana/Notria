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

interface StudentData {
  id: number;
  userId: number;
  inviteCode: string;
  examType: string;
  grade: string;
  series?: string | null;
  school?: string | null;
  targetScore?: number | null;
  prioritySubjects?: string[] | null;
  dailyTime?: string | null;
  onboardingCompleted: boolean;
  assessmentCompleted: boolean;
  currentStreak: number;
  longestStreak: number;
}

interface ParentData {
  id: number;
  userId: number;
  inviteCode: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  student: StudentData | null;
  parent: ParentData | null;
  linkedStudents: Array<{ id: number; firstName: string; lastName: string; phone: string; isConfirmed: boolean }>;
  linkedParents: Array<{ id: number; firstName: string; lastName: string; phone: string; isConfirmed: boolean }>;
  hasStudyPlan: boolean;
  hasSchedule: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string, linkCode?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: "student" | "parent";
  linkCode?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [parent, setParent] = useState<ParentData | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<AuthContextValue["linkedStudents"]>([]);
  const [linkedParents, setLinkedParents] = useState<AuthContextValue["linkedParents"]>([]);
  const [hasStudyPlan, setHasStudyPlan] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);
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
        setStudent(meData.student ?? null);
        setParent(meData.parent ?? null);
        setLinkedStudents(meData.linkedStudents ?? []);
        setLinkedParents(meData.linkedParents ?? []);
        setHasStudyPlan(!!meData.hasStudyPlan);
        setHasSchedule(!!meData.hasSchedule);
      } catch {
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

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setStudent(data.student ?? null);
      setParent(data.parent ?? null);
      setLinkedStudents(data.linkedStudents ?? []);
      setLinkedParents(data.linkedParents ?? []);
      setHasStudyPlan(!!data.hasStudyPlan);
      setHasSchedule(!!data.hasSchedule);
    } catch {
      // Ignore errors
    }
  }, []);

  const login = useCallback(async (phone: string, password: string, linkCode?: string) => {
    const { data } = await api.post("/auth/login", { phone, password, linkCode });
    setAccessToken(data.accessToken);
    setUser(data.user);
    // Fetch full /me to get student data
    try {
      const { data: meData } = await api.get("/auth/me");
      setStudent(meData.student ?? null);
      setParent(meData.parent ?? null);
      setLinkedStudents(meData.linkedStudents ?? []);
      setLinkedParents(meData.linkedParents ?? []);
      setHasStudyPlan(!!meData.hasStudyPlan);
      setHasSchedule(!!meData.hasSchedule);
    } catch {
      // Continue
    }
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    const { data } = await api.post("/auth/register", registerData);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStudent(null); // New user, no student record yet
    setParent(null);
    setLinkedStudents([]);
    setLinkedParents([]);
    setHasStudyPlan(false);
    setHasSchedule(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Continue
    }
    setAccessToken(null);
    setUser(null);
    setStudent(null);
    setParent(null);
    setLinkedStudents([]);
    setLinkedParents([]);
    setHasStudyPlan(false);
    setHasSchedule(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      student,
      parent,
      linkedStudents,
      linkedParents,
      hasStudyPlan,
      hasSchedule,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, student, parent, linkedStudents, linkedParents, hasStudyPlan, hasSchedule, isLoading, login, register, logout, refreshMe]
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
