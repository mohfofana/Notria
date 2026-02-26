"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <GraduationCap className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          <span className="text-xl font-bold">Notria</span>
        </Link>

        <div className="space-y-6">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] border-2 border-dashed border-white/55 rotate-[-2deg]" />
            <div className="pointer-events-none absolute -inset-1 rounded-[1.7rem] border border-white/60 rotate-[1.5deg]" />
            <div className="relative overflow-hidden rounded-[1.5rem] border-4 border-white/70 shadow-2xl">
              <Image
                src="/illustrations/fatou.png"
                alt="Photo d'une eleve Notria"
                width={900}
                height={1200}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>

          <p className="text-center text-sm font-medium text-primary-foreground/90">
            Fatou, eleve BEPC - \"Avec Prof Ada, je comprends enfin mes cours.\"
          </p>
        </div>

        <p className="text-sm opacity-80">
          100% gratuit &middot; Disponible 24h/24
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Notria</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
