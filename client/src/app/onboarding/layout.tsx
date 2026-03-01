"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const STEPS = [
  { path: "/onboarding/step-1", label: "Profil", number: 1 },
  { path: "/onboarding/step-2", label: "Matieres", number: 2 },
  { path: "/onboarding/step-3", label: "Objectifs", number: 3 },
  { path: "/onboarding/step-4", label: "Planning", number: 4 },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, student, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace("/connexion"); return; }
    if (user?.role !== "student") { router.replace("/dashboard"); return; }
    if (student?.onboardingCompleted) { router.replace("/dashboard"); }
  }, [isLoading, isAuthenticated, user, student, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "student") return null;

  const effectivePath = pathname === "/onboarding/schedule" ? "/onboarding/step-4" : pathname;
  const currentStepIndex = STEPS.findIndex((s) => s.path === effectivePath);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-6 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold">
            N
          </span>
          <span className="font-display text-base font-bold">Notria</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {STEPS.map((step, i) => (
            <div key={step.path} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition-all ${
                    i < currentStepIndex
                      ? "bg-accent text-accent-foreground"
                      : i === currentStepIndex
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    i <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-14 rounded-full -mt-5 ${
                    i < currentStepIndex ? "bg-accent" : "bg-muted"
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
