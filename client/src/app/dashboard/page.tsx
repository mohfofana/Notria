"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/connexion");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <GraduationCap className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">Notria</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Deconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">
          Salut {user.firstName} !
        </h1>
        <p className="text-muted-foreground mb-8">
          Bienvenue sur Notria. Ton dashboard sera disponible ici.
        </p>

        <div className="rounded-xl border bg-card p-8 text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {user.role === "student"
              ? "L'onboarding arrive bientot"
              : "Le tableau de bord parent arrive bientot"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {user.role === "student"
              ? "Tu pourras bientot configurer ton profil, choisir tes matieres et commencer a etudier avec Prof Ada."
              : "Tu pourras bientot suivre les progres de ton enfant et recevoir des resumes IA."}
          </p>
        </div>
      </main>
    </div>
  );
}
