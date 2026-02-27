"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  LogOut,
  BookOpen,
  Play,
  MessageSquare,
  ChevronRight,
  Target,
  Camera,
  FileText,
  Users,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";

interface WeekEntry {
  id: number;
  subject: string;
  topic: string;
  objective: string;
  status: string;
}

interface CurrentWeekData {
  weekNumber: number;
  totalWeeks: number;
  entries: WeekEntry[];
}

export default function DashboardPage() {
  const { user, student, hasSchedule, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState<CurrentWeekData | null>(null);
  const [isStarting, setIsStarting] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (!isLoading && isAuthenticated && user?.role === "student") {
      const next = getNextOnboardingPath({ student, hasSchedule });
      if (next !== "/dashboard") router.replace(next);
    }
  }, [isLoading, isAuthenticated, user, student, hasSchedule, router]);

  // Fetch current week data
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "student" && student?.onboardingCompleted) {
      api.get("/study-plans/current-week").then(({ data }) => {
        setCurrentWeek(data);
      }).catch(() => {});
    }
  }, [isLoading, isAuthenticated, user, student]);

  async function startSession(entry: WeekEntry) {
    setIsStarting(entry.id);
    try {
      // Create conversation tied to this study plan topic
      const { data } = await api.post("/chat", {
        subject: entry.subject,
        topic: entry.topic,
      });
      // Navigate to chat with auto-start flag
      router.push(`/chat?id=${data.conversation.id}&autostart=1`);
    } catch {
      setIsStarting(null);
    }
  }

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
  if (user.role === "student" && getNextOnboardingPath({ student, hasSchedule }) !== "/dashboard") return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
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
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">
          Salut {user.firstName} !
        </h1>

        {user.role === "student" && student ? (
          <>
            {/* Week progress */}
            {currentWeek && (
              <p className="text-muted-foreground mb-8">
                Semaine {currentWeek.weekNumber}/{currentWeek.totalWeeks} de ton programme
              </p>
            )}

            {/* Sessions of the week */}
            {currentWeek && currentWeek.entries.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Sessions de la semaine
                </h2>
                <div className="space-y-3">
                  {currentWeek.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-xl border p-5 transition-colors ${
                        entry.status === "completed"
                          ? "bg-muted/30 border-border"
                          : "bg-card border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                              {entry.subject}
                            </span>
                            {entry.status === "completed" && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Terminé
                              </span>
                            )}
                            {entry.status === "in_progress" && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                En cours
                              </span>
                            )}
                          </div>
                          <p className="font-medium">{entry.topic}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{entry.objective}</p>
                        </div>
                        {entry.status !== "completed" && (
                          <Button
                            onClick={() => startSession(entry)}
                            disabled={isStarting === entry.id}
                            size="sm"
                            className="shrink-0"
                          >
                            {isStarting === entry.id ? (
                              "..."
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Commencer
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/chat"
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Question libre</p>
                  <p className="text-xs text-muted-foreground">Demander à Prof Ada</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Note cible : {student.targetScore}/20</p>
                  <p className="text-xs text-muted-foreground">
                    Parcours BEPC (3eme)
                  </p>
                </div>
              </div>

              <Link
                href="/notria-vision"
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Notria Vision</p>
                  <p className="text-xs text-muted-foreground">Scanner et corriger un exercice</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/examens"
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">BEPC Blanc</p>
                  <p className="text-xs text-muted-foreground">Simulation et correction détaillée</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/paiement"
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Abonnements</p>
                  <p className="text-xs text-muted-foreground">Gérer ton plan et paiements</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-8">Bienvenue sur Notria.</p>
            <div className="rounded-xl border bg-card p-8 text-center">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Le tableau de bord parent arrive bientôt
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tu pourras bientôt suivre les progrès de ton enfant et recevoir des résumés IA.
              </p>
              <Link href="/parent" className="inline-flex mt-4">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Voir la vue parent
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
