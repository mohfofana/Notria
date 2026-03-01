"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getNextOnboardingPath } from "@/lib/onboarding";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, student, hasSchedule } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === "student") {
        router.replace(getNextOnboardingPath({ student, hasSchedule }));
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, student, hasSchedule, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel - warm branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-primary/85 p-10 text-primary-foreground relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-10 h-32 w-32 rounded-full bg-white/3" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 font-display text-lg font-bold backdrop-blur-sm">
            N
          </span>
          <span className="font-display text-xl font-bold">Notria</span>
        </Link>

        <div className="relative space-y-6 text-center">
          <div className="mx-auto w-full max-w-xs">
            <div className="rounded-3xl border-2 border-white/20 bg-white/10 p-8 backdrop-blur-sm">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Revise sans stress
              </h2>
              <p className="text-sm text-primary-foreground/80">
                Des seances courtes, un programme adapte a toi, et Prof Ada toujours disponible.
              </p>
            </div>
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-primary-foreground/80">
            <Sparkles className="h-4 w-4" />
            Seances courtes, progression visible.
          </p>
        </div>

        <p className="relative text-sm text-primary-foreground/60">
          Fait avec coeur en Cote d'Ivoire
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center mb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-bold">
              N
            </span>
            <span className="font-display text-xl font-bold">Notria</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
