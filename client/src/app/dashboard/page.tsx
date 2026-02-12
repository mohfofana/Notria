"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const { user, student, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    // Redirect students who haven't completed onboarding
    if (!isLoading && isAuthenticated && user?.role === "student") {
      if (!student || !student.onboardingCompleted) {
        router.replace("/onboarding/step-1");
      }
    }
  }, [isLoading, isAuthenticated, user, student, router]);

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

  // If student hasn't completed onboarding, don't render (redirect is happening)
  if (user.role === "student" && (!student || !student.onboardingCompleted)) {
    return null;
  }

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

        {user.role === "student" && student ? (
          <>
            <p className="text-muted-foreground mb-8">
              Ton programme est prêt. Prof Ada t'attend !
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold">Mon profil</h2>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Examen : <span className="text-foreground font-medium">{student.examType}</span></p>
                  <p>Classe : <span className="text-foreground font-medium">{student.grade}</span></p>
                  {student.series && (
                    <p>Série : <span className="text-foreground font-medium">{student.series}</span></p>
                  )}
                  {student.targetScore && (
                    <p>Note cible : <span className="text-foreground font-medium">{student.targetScore}/20</span></p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold">Programme</h2>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {Array.isArray(student.prioritySubjects) && (
                    <p>
                      Matières prioritaires :{" "}
                      <span className="text-foreground font-medium">
                        {(student.prioritySubjects as string[]).join(", ")}
                      </span>
                    </p>
                  )}
                  {student.dailyTime && (
                    <p>Temps quotidien : <span className="text-foreground font-medium">{student.dailyTime}/jour</span></p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-8">
              Bienvenue sur Notria.
            </p>
            <div className="rounded-xl border bg-card p-8 text-center">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Le tableau de bord parent arrive bientôt
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tu pourras bientôt suivre les progrès de ton enfant et recevoir des résumés IA.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
