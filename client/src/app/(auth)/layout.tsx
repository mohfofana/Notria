"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

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

        <div className="space-y-4">
          <blockquote className="text-lg leading-relaxed">
            &ldquo;Avec Notria, j&apos;ai eu 16/20 en maths au BAC alors que je
            galérais en début d&apos;année. Prof Ada m&apos;explique tout
            clairement.&rdquo;
          </blockquote>
          <p className="font-medium">Fatou K., Terminale D, Abidjan</p>
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
