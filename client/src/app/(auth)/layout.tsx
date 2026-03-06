"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
      {/* Left panel - branding with student image */}
      <div className="hidden lg:flex flex-col justify-between sidebar-bg p-10 text-white relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/students/hero-students.jpg"
            alt="Eleves ivoiriens"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(248,36%,20%)/0.8] to-[hsl(248,36%,14%)/0.95]" />
        </div>

        <Link href="/" className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-xl font-bold">Notria</span>
        </Link>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Revise ton BEPC<br />avec Prof Ada
            </h2>
            <p className="text-lg text-white/80 max-w-sm">
              Ton tuteur IA personnel qui t&apos;accompagne dans toutes les matieres du programme ivoirien.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">4500+</p>
              <p className="text-xs text-white/60">Eleves actifs</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">5</p>
              <p className="text-xs text-white/60">Matieres</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">24/7</p>
              <p className="text-xs text-white/60">Disponible</p>
            </div>
          </div>

          <p className="text-sm text-white/60 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            100% gratuit. Seances courtes. Progression visible.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          Notria &middot; IA educative pour le programme ivoirien
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-4">
            <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold text-foreground">Notria</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
