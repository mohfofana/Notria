"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  LogOut,
  Play,
  MessageSquare,
  ChevronRight,
  Target,
  Camera,
  FileText,
  Users,
  CreditCard,
  BookOpen,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";

interface ProgramSession {
  id: number;
  topic: string;
  type: "lesson" | "exercise" | "quiz" | "recap" | "revision" | "evaluation";
  title: string;
  durationMinutes: number;
  status: "upcoming" | "in_progress" | "completed" | "skipped";
}

interface NextProgramSessionResponse {
  success: boolean;
  data: {
    hasNextSession: boolean;
    weekNumber?: number;
    weekTheme?: string;
    session?: ProgramSession;
  };
}

interface TodayHomeworkResponse {
  success: boolean;
  data: {
    homework: Array<{ id: number }>;
    count: number;
  };
}

function getTypeLabel(type: ProgramSession["type"]) {
  switch (type) {
    case "lesson":
      return "Cours";
    case "exercise":
      return "Exercice";
    case "quiz":
      return "Quiz";
    case "recap":
      return "Recap";
    case "revision":
      return "Revision";
    case "evaluation":
      return "Evaluation";
  }
}

export default function DashboardPage() {
  const { user, student, hasSchedule, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [nextSession, setNextSession] = useState<NextProgramSessionResponse["data"] | null>(null);
  const [homeworkCount, setHomeworkCount] = useState<number>(0);
  const [isStartingProgramSession, setIsStartingProgramSession] = useState(false);
  const [isStartingFreeQuestion, setIsStartingFreeQuestion] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (!isLoading && isAuthenticated && user?.role === "student") {
      const next = getNextOnboardingPath({ student, hasSchedule });
      if (next !== "/dashboard") router.replace(next);
      return;
    }
    if (!isLoading && isAuthenticated && user?.role === "parent") {
      router.replace("/parent/dashboard");
      return;
    }
    if (!isLoading && isAuthenticated && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, user, student, hasSchedule, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "student" && student?.onboardingCompleted) {
      api.get<NextProgramSessionResponse>("/course-program/next-session").then(({ data }) => {
        setNextSession(data?.data ?? null);
      }).catch(() => {
        setNextSession(null);
      });

      api.get<TodayHomeworkResponse>("/sessions/homework/today").then(({ data }) => {
        setHomeworkCount(data?.data?.count ?? 0);
      }).catch(() => {
        setHomeworkCount(0);
      });
    }
  }, [isLoading, isAuthenticated, user, student]);

  async function startProgramSession() {
    const sessionId = nextSession?.session?.id;
    if (!sessionId) return;
    setIsStartingProgramSession(true);
    router.push(`/session/today?programSessionId=${sessionId}`);
  }

  async function startFreeQuestion() {
    setIsStartingFreeQuestion(true);
    try {
      const { data } = await api.post("/chat", {
        subject: "Mathematiques",
        topic: "Question libre",
      });
      router.push(`/chat?id=${data.conversation.id}`);
    } catch {
      setIsStartingFreeQuestion(false);
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
  const isFinalExercise = nextSession?.session?.type === "evaluation";

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="soft-shell rounded-2xl mb-4">
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
              Deconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-2 py-2">
        <h1 className="text-3xl font-bold mb-1">Salut {user.firstName} !</h1>

        {user.role === "student" && student ? (
          <>
            <p className="text-base text-muted-foreground mb-6">
              Ton apprentissage suit le programme personalise semaine par semaine.
            </p>

            {nextSession?.hasNextSession && nextSession.session ? (
              <div className="soft-card rounded-2xl p-5 mb-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Prochaine micro-session
                      </span>
                      {nextSession.weekNumber && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Semaine {nextSession.weekNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold">{nextSession.session.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {nextSession.weekTheme || nextSession.session.topic}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {nextSession.session.durationMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {getTypeLabel(nextSession.session.type)}
                      </span>
                      {nextSession.session.status === "in_progress" && (
                        <span className="text-primary font-medium">En cours</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Ordre strict: termine cette micro-session pour debloquer la suivante.
                    </p>
                    {isFinalExercise && (
                      <div className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Exo final obligatoire: valide ce topic avant de passer au suivant
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={startProgramSession}
                    disabled={isStartingProgramSession}
                    className="shrink-0"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {nextSession.session.status === "in_progress" ? "Continuer" : "Commencer"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="soft-card rounded-2xl p-5 mb-8">
                <p className="font-medium">Aucune micro-session en attente.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ton programme est termine ou pas encore genere.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/programme"
                className="soft-card rounded-2xl p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Mon programme</p>
                  <p className="text-sm text-muted-foreground">
                    Objectif : {student.targetScore}/20
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <div className="soft-card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Devoirs du jour</p>
                  <p className="text-sm text-muted-foreground">{homeworkCount} exercice(s) a faire</p>
                </div>
              </div>

              <button
                type="button"
                onClick={startFreeQuestion}
                disabled={isStartingFreeQuestion}
                className="soft-card rounded-2xl p-5 hover:border-primary/30 transition-colors group flex items-center gap-4 text-left disabled:opacity-70"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Question libre</p>
                  <p className="text-sm text-muted-foreground">
                    {isStartingFreeQuestion ? "Ouverture..." : "Demander a Prof Ada"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <Link
                href="/notria-vision"
                className="soft-card rounded-2xl p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Notria Vision</p>
                  <p className="text-sm text-muted-foreground">Prendre en photo et corriger un exercice</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/examens"
                className="soft-card rounded-2xl p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">{student.examType} Blanc</p>
                  <p className="text-sm text-muted-foreground">Simulation et correction detaillee</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/paiement"
                className="soft-card rounded-2xl p-5 hover:border-primary/30 transition-colors group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Abonnement</p>
                  <p className="text-sm text-muted-foreground">Gerer ton plan et tes paiements</p>
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
              <h2 className="text-lg font-semibold mb-2">Le tableau de bord parent arrive bientot</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tu pourras bientot suivre les progres de ton enfant et recevoir des resumes IA.
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
