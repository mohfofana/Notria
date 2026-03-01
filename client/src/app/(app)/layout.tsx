"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/nav/sidebar";
import { TopHeader } from "@/components/nav/top-header";
import { BottomTabs } from "@/components/nav/bottom-tabs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, student } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (user?.role === "student" && student && !student.onboardingCompleted) {
      router.replace("/onboarding/step-1");
    }
  }, [isAuthenticated, isLoading, user, student, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-[240px]">
        <TopHeader />
        <main className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-6 safe-bottom">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
