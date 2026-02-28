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

interface TodaySessionResponse {
  success: boolean;
  data: {
    hasSession: boolean;
    session?: {
      id: number;
      subject: string;
      startTime: string;
      durationMinutes: number;
      conversationId: number;
    };
  };
}

interface TodayHomeworkResponse {
  success: boolean;
  data: {
    homework: Array<{ id: number }>;
    count: number;
  };
}

interface ChatConversationSummary {
  id: number;
  subject: string;
  topic?: string | null;
  title?: string | null;
}

const MATH_SUBJECT = "Mathématiques";

export default function DashboardPage() {
  const { user, student, hasSchedule, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState<CurrentWeekData | null>(null);
  const [chatConversations, setChatConversations] = useState<ChatConversationSummary[]>([]);
  const [todaySession, setTodaySession] = useState<TodaySessionResponse["data"]["session"] | null>(null);
  const [homeworkCount, setHomeworkCount] = useState<number>(0);
  const [isStarting, setIsStarting] = useState<number | null>(null);
  const [isStartingFreeQuestion, setIsStartingFreeQuestion] = useState(false);
  const weeklyMathEntries = currentWeek?.entries.filter((entry) => entry.subject === MATH_SUBJECT) ?? [];

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

  // Fetch current week data
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "student" && student?.onboardingCompleted) {
      api.get("/study-plans/current-week").then(({ data }) => {
        setCurrentWeek(data);
      }).catch(() => {});

      api.get<TodaySessionResponse>("/sessions/today").then(({ data }) => {
        setTodaySession(data?.data?.session ?? null);
      }).catch(() => {
        setTodaySession(null);
      });

      api.get<TodayHomeworkResponse>("/sessions/homework/today").then(({ data }) => {
        setHomeworkCount(data?.data?.count ?? 0);
      }).catch(() => {
        setHomeworkCount(0);
      });

      api.get<{ conversations: ChatConversationSummary[] }>("/chat").then(({ data }) => {
        setChatConversations(data?.conversations ?? []);
      }).catch(() => {
        setChatConversations([]);
      });
    }
  }, [isLoading, isAuthenticated, user, student]);

  function normalizeText(value?: string | null) {
    return (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function findExistingConversation(entry: WeekEntry) {
    const subjectKey = normalizeText(entry.subject);
    const topicKey = normalizeText(entry.topic);

    return chatConversations.find((conv) => {
      const sameSubject = normalizeText(conv.subject) === subjectKey;
      if (!sameSubject) return false;

      const convTopic = normalizeText(conv.topic);
      const convTitle = normalizeText(conv.title);
      return convTopic === topicKey || convTitle.includes(topicKey);
    });
  }

  async function startSession(entry: WeekEntry) {
    setIsStarting(entry.id);
    try {
      const existing = findExistingConversation(entry);
      if (existing) {
        router.push(`/chat?id=${existing.id}`);
        return;
      }

      // Create conversation tied to this study plan topic
      const { data } = await api.post("/chat", {
        subject: entry.subject,
        topic: entry.topic,
      });
      setChatConversations((prev) => [data.conversation, ...prev]);
      // Navigate to chat with auto-start flag
      const subject = encodeURIComponent(entry.subject);
      const topic = encodeURIComponent(entry.topic);
      router.push(`/chat?id=${data.conversation.id}&autostart=1&subject=${subject}&topic=${topic}`);
    } catch {
      setIsStarting(null);
    }
  }

  async function startFreeQuestion() {
    setIsStartingFreeQuestion(true);
    try {
      const { data } = await api.post("/chat", {
        subject: "Mathématiques",
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
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-2 py-2">
        <h1 className="text-3xl font-bold mb-1">
          Salut {user.firstName} !
        </h1>

        {user.role === "student" && student ? (
          <>
            {/* Week progress */}
            {currentWeek && (
              <p className="text-base text-muted-foreground mb-8">
                Semaine {currentWeek.weekNumber}/{currentWeek.totalWeeks} de ton parcours
              </p>
            )}

            {/* Sessions of the week */}
            {currentWeek && weeklyMathEntries.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Sessions de maths de la semaine
                </h2>
                <div className="space-y-3">
                  {weeklyMathEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`soft-card rounded-2xl p-5 transition-colors ${
                        entry.status === "completed"
                          ? "opacity-80"
                          : "hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                              {entry.subject}
                            </span>
                            {entry.status === "completed" && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                Terminé
                              </span>
                            )}
                            {entry.status === "in_progress" && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                En cours
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-semibold">{entry.topic}</p>
                          <p className="text-base text-muted-foreground mt-0.5">{entry.objective}</p>
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
                                {entry.status === "in_progress" || findExistingConversation(entry)
                                  ? "Continuer"
                                  : "Commencer"}
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

            {currentWeek && weeklyMathEntries.length === 0 && (
              <div className="mb-8 soft-card rounded-2xl p-5">
                <p className="font-medium">Aucune session de maths cette semaine.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Lance une question libre pour continuer a pratiquer.
                </p>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="soft-card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">
                    {todaySession ? "Seance du jour prete" : "Pas de seance planifiee"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {todaySession
                      ? `${todaySession.subject} • ${todaySession.durationMinutes} min`
                      : "Lance une session libre de mathematiques"}
                  </p>
                </div>
              </div>

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
                    {isStartingFreeQuestion ? "Ouverture..." : "Demander à Prof Ada"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="soft-card rounded-2xl p-5 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Objectif : {student.targetScore}/20</p>
                  <p className="text-sm text-muted-foreground">
                    Parcours {student.examType} ({student.grade})
                  </p>
                </div>
              </div>

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
