"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GraduationCap, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const STEPS = [
  { path: "/onboarding/step-1", label: "Profil", number: 1 },
  { path: "/onboarding/step-2", label: "Matières", number: 2 },
  { path: "/onboarding/step-3", label: "Objectifs", number: 3 },
  { path: "/onboarding/step-4", label: "Planning", number: 4 },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, student, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    if (student?.onboardingCompleted) {
      router.replace("/dashboard");
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

  if (!isAuthenticated || user?.role !== "student") return null;

  const effectivePath = pathname === "/onboarding/schedule" ? "/onboarding/step-4" : pathname;
  const currentStepIndex = STEPS.findIndex((s) => s.path === effectivePath);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto flex items-center gap-2 px-6 py-4">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold">Notria</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((step, i) => (
            <div key={step.path} className="flex items-center">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                  i < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentStepIndex
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStepIndex ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:inline ${
                  i <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 sm:mx-6 h-0.5 w-6 sm:w-12 ${
                    i < currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
