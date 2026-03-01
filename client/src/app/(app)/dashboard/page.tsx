"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  MessageSquare,
  ChevronRight,
  Camera,
  FileText,
  CreditCard,
  BookOpen,
  Clock,
  Calendar,
  Flame,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  data: { homework: Array<{ id: number }>; count: number };
}

const typeConfig: Record<ProgramSession["type"], { label: string; color: string }> = {
  lesson: { label: "Cours", color: "bg-info/12 text-info" },
  exercise: { label: "Exercice", color: "bg-purple-100 text-purple-700" },
  quiz: { label: "Quiz", color: "bg-amber-100 text-amber-700" },
  recap: { label: "Recap", color: "bg-muted text-muted-foreground" },
  revision: { label: "Revision", color: "bg-muted text-muted-foreground" },
  evaluation: { label: "Evaluation", color: "bg-primary/10 text-primary" },
};

const greetings = [
  "On est ensemble !",
  "C'est parti mon kiki !",
  "Aujourd'hui on casse tout !",
  "Prof Ada t'attend !",
  "Tu vas gerer aujourd'hui !",
];

export default function DashboardPage() {
  const { user, student, hasSchedule, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [nextSession, setNextSession] = useState<NextProgramSessionResponse["data"] | null>(null);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (user?.role === "student") {
      const next = getNextOnboardingPath({ student, hasSchedule });
      if (next !== "/dashboard") { router.replace(next); return; }
    }
    if (user?.role === "parent") { router.replace("/parent/dashboard"); return; }
    if (user?.role === "admin") { router.replace("/admin"); return; }
  }, [isLoading, isAuthenticated, user, student, hasSchedule, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "student" && student?.onboardingCompleted) {
      api.get<NextProgramSessionResponse>("/course-program/next-session")
        .then(({ data }) => setNextSession(data?.data ?? null))
        .catch(() => setNextSession(null));
      api.get<TodayHomeworkResponse>("/sessions/homework/today")
        .then(({ data }) => setHomeworkCount(data?.data?.count ?? 0))
        .catch(() => setHomeworkCount(0));
    }
  }, [isLoading, isAuthenticated, user, student]);

  function startProgramSession() {
    if (!nextSession?.session?.id) return;
    setIsStartingSession(true);
    router.push(`/session/today?programSessionId=${nextSession.session.id}`);
  }

  async function startFreeQuestion() {
    setIsStartingChat(true);
    try {
      const { data } = await api.post("/chat", { subject: "Mathematiques", topic: "Question libre" });
      router.push(`/chat?id=${data.conversation.id}`);
    } catch { setIsStartingChat(false); }
  }

  if (isLoading || !user) return null;
  if (user.role === "student" && getNextOnboardingPath({ student, hasSchedule }) !== "/dashboard") return null;

  const isFinalExercise = nextSession?.session?.type === "evaluation";

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/85 p-5 text-primary-foreground animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">
              Salut {user.firstName} !
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">{greeting}</p>
          </div>
          {student && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
              <Flame className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-bold">{student.currentStreak}</span>
            </div>
          )}
        </div>
        {student && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-primary-foreground/70 mb-1.5">
              <span>Progression de la semaine</span>
              <span>Objectif: {student.targetScore}/20</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-700"
                style={{ width: "35%" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Next session card */}
      {user.role === "student" && student && (
        <>
          {nextSession?.hasNextSession && nextSession.session ? (
            <div className="rounded-2xl border border-border bg-card p-5 animate-slide-up delay-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Prochaine session
                </span>
                {nextSession.weekNumber && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    Semaine {nextSession.weekNumber}
                  </span>
                )}
              </div>

              <h2 className="font-display text-lg font-semibold">
                {nextSession.session.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {nextSession.weekTheme || nextSession.session.topic}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeConfig[nextSession.session.type].color}`}>
                  {typeConfig[nextSession.session.type].label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {nextSession.session.durationMinutes} min
                </span>
                {nextSession.session.status === "in_progress" && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    En cours
                  </span>
                )}
              </div>

              {isFinalExercise && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
                  Exo final — Valide ce topic pour passer au suivant
                </div>
              )}

              <Button
                onClick={startProgramSession}
                disabled={isStartingSession}
                size="lg"
                className="mt-4 w-full"
              >
                <Play className="h-4 w-4" />
                {nextSession.session.status === "in_progress" ? "Continuer la session" : "Commencer"}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-center animate-slide-up delay-1">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Pas de session en attente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ton programme est termine ou pas encore genere.
              </p>
            </div>
          )}

          {/* Quick actions */}
          <div className="animate-slide-up delay-2">
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Acces rapide
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/programme" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all group">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/8">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">Mon programme</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Objectif: {student.targetScore}/20
                </p>
              </Link>

              <button
                onClick={startFreeQuestion}
                disabled={isStartingChat}
                className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all group text-left disabled:opacity-60"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-accent/10">
                  <MessageSquare className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm font-semibold">
                  {isStartingChat ? "Ouverture..." : "Question libre"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Demander a Prof Ada</p>
              </button>

              <Link href="/notria-vision" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all group">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-purple-100">
                  <Camera className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-semibold">Notria Vision</p>
                <p className="text-xs text-muted-foreground mt-0.5">Photo → correction</p>
              </Link>

              <Link href="/examens" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all group">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-50">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm font-semibold">{student.examType} Blanc</p>
                <p className="text-xs text-muted-foreground mt-0.5">Simulation d'examen</p>
              </Link>
            </div>
          </div>

          {/* Homework + Payment */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up delay-3">
            <Link href="/homework/today" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info/10">
                <BookOpen className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-semibold">Devoirs</p>
                <p className="text-xs text-muted-foreground">{homeworkCount} a faire</p>
              </div>
            </Link>

            <Link href="/paiement" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Abonnement</p>
                <p className="text-xs text-muted-foreground">Gerer ton plan</p>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Parent fallback */}
      {user.role !== "student" && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-semibold mb-2">
            Tableau de bord parent
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tu pourras bientot suivre les progres de ton enfant et recevoir des resumes IA.
          </p>
          <Link href="/parent" className="inline-flex mt-4">
            <Button variant="outline">
              <Users className="h-4 w-4" />
              Voir la vue parent
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
