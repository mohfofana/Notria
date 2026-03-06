"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, student, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (user?.role !== "student") {
      router.replace("/dashboard");
      return;
    }
    if (!student?.onboardingCompleted) {
      router.replace("/onboarding/step-1");
    }
  }, [isLoading, isAuthenticated, user, student, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <GraduationCap className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "student" || !student?.onboardingCompleted) {
    return null;
  }

  return <>{children}</>;
}
