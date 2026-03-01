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
  RefreshCw,
  Trophy,
  Swords,
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

interface CompetencyProgressItem {
  topic: string;
  total: number;
  correct: number;
  percent: number;
}

interface GamificationResponse {
  success: boolean;
  data: {
    profile: {
      points: number;
      rank: number;
      totalPlayers: number;
      league: string;
      streak: number;
      topSubject: string;
      avatar: string;
      pointsToNextLeague: number;
    };
    leaderboard: Array<{
      rank: number;
      displayName: string;
      points: number;
      league: string;
      avatar: string;
      isCurrent: boolean;
    }>;
    nearby: Array<{
      rank: number;
      displayName: string;
      points: number;
      league: string;
      avatar: string;
      isCurrent: boolean;
    }>;
    missions: Array<{
      id: string;
      label: string;
      progress: number;
      target: number;
      reward: number;
      done: boolean;
    }>;
    progress: {
      dailyPointsEstimate: number;
      weeklyPoints: number;
      weeklyTargetPoints: number;
      weeklyPercent: number;
      nextMilestone: {
        points: number;
        reward: string;
      } | null;
    };
  };
}

const AVATAR_EMOJIS: Record<string, string> = {
  "rocket-fox": "🦊",
  "tiger-math": "🐯",
  "eagle-scout": "🦅",
  "panther-logic": "🐆",
  "koala-wiz": "🐨",
  "falcon-pro": "🦉",
  "rhino-core": "🦏",
  "dolphin-brain": "🐬",
};

const AVATAR_CHOICES = Object.values(AVATAR_EMOJIS);

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
  const { user, student, linkedParents, hasSchedule, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [nextSession, setNextSession] = useState<NextProgramSessionResponse["data"] | null>(null);
  const [homeworkCount, setHomeworkCount] = useState<number>(0);
  const [todaySession, setTodaySession] = useState<TodaySessionResponse["data"]["session"] | null>(null);
  const [competencies, setCompetencies] = useState<CompetencyProgressItem[]>([]);
  const [gamification, setGamification] = useState<GamificationResponse["data"] | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("🦊");
  const [isStartingProgramSession, setIsStartingProgramSession] = useState(false);
  const [isStartingFreeQuestion, setIsStartingFreeQuestion] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

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

  async function loadDashboardData() {
    setIsRefreshingData(true);
    try {
      const [nextSessionRes, homeworkRes, todaySessionRes, gamificationRes] = await Promise.all([
        api.get<NextProgramSessionResponse>("/course-program/next-session"),
        api.get<TodayHomeworkResponse>("/sessions/homework/today"),
        api.get<TodaySessionResponse>("/sessions/today"),
        api.get<GamificationResponse>("/sessions/gamification"),
      ]);
      const competenciesRes = await api.get<{ success: boolean; data: CompetencyProgressItem[] }>("/sessions/competencies");

      setNextSession(nextSessionRes.data?.data ?? null);
      setHomeworkCount(homeworkRes.data?.data?.count ?? 0);
      setTodaySession(todaySessionRes.data?.data?.hasSession ? todaySessionRes.data?.data?.session ?? null : null);
      setCompetencies(competenciesRes.data?.data ?? []);
      setGamification(gamificationRes.data?.data ?? null);
    } catch {
      setNextSession(null);
      setHomeworkCount(0);
      setTodaySession(null);
      setCompetencies([]);
      setGamification(null);
    } finally {
      setIsRefreshingData(false);
    }
  }

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "student" && student?.onboardingCompleted) {
      loadDashboardData();
    }
  }, [isLoading, isAuthenticated, user, student]);

  useEffect(() => {
    if (!user || user.role !== "student") return;
    const stored = window.localStorage.getItem(`notria-avatar-${user.id}`);
    if (stored && AVATAR_CHOICES.includes(stored)) {
      setSelectedAvatar(stored);
      return;
    }
    if (gamification?.profile?.avatar) {
      const mapped = AVATAR_EMOJIS[gamification.profile.avatar];
      if (mapped) setSelectedAvatar(mapped);
    }
  }, [user, gamification]);

  async function startProgramSession() {
    const sessionId = nextSession?.session?.id;
    if (!sessionId) return;
    setIsStartingProgramSession(true);
    router.push(`/session/today?programSessionId=${sessionId}`);
  }

  async function startFreeQuestion() {
    setIsStartingFreeQuestion(true);
    try {
      const preferredSubject =
        student?.prioritySubjects && student.prioritySubjects.length > 0
          ? student.prioritySubjects[0]
          : "Mathématiques";
      const { data } = await api.post("/chat", {
        subject: preferredSubject,
        topic: "Question libre",
      });
      router.push(`/chat?id=${data.conversation.id}`);
    } catch {
      setIsStartingFreeQuestion(false);
    }
  }

  async function startDuel() {
    try {
      const preferredSubject =
        student?.prioritySubjects && student.prioritySubjects.length > 0
          ? student.prioritySubjects[0]
          : "Mathématiques";
      const { data } = await api.post("/chat", {
        subject: preferredSubject,
        topic: "Défi du jour",
      });
      router.push(`/chat?id=${data.conversation.id}&autostart=1&subject=${encodeURIComponent(preferredSubject)}&topic=${encodeURIComponent("Défi du jour")}`);
    } catch {
      // noop
    }
  }

  function chooseAvatar(avatar: string) {
    setSelectedAvatar(avatar);
    if (!user) return;
    window.localStorage.setItem(`notria-avatar-${user.id}`, avatar);
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
        <div className="mb-1 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Salut {user.firstName} !</h1>
          <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={isRefreshingData}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingData ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {user.role === "student" && student ? (
          <>
            <p className="text-base text-muted-foreground mb-6">
              Ton apprentissage suit le programme personalise semaine par semaine.
            </p>
            <div className="soft-card rounded-2xl p-4 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                Liaison parent-eleve
              </p>
              <p className="text-sm">
                Ton code de liaison: <span className="font-semibold tracking-wider">{student.inviteCode}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Parents lies: {linkedParents.length}
              </p>
            </div>

            {gamification?.profile && (
              <div className="soft-card rounded-2xl p-5 mb-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border bg-white text-3xl">
                      {selectedAvatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Arène Notria</p>
                      <p className="text-lg font-semibold mt-1">
                        Ligue {gamification.profile.league} • Rang #{gamification.profile.rank}/{gamification.profile.totalPlayers}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {gamification.profile.points} pts • Série {gamification.profile.streak} jours • Matière forte: {gamification.profile.topSubject}
                      </p>
                      {gamification.profile.pointsToNextLeague > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Encore {gamification.profile.pointsToNextLeague} pts pour la ligue suivante.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={startDuel}>
                    <Swords className="h-4 w-4 mr-1" />
                    Lancer un défi
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {AVATAR_CHOICES.map((avatar) => (
                    <button
                      type="button"
                      key={avatar}
                      onClick={() => chooseAvatar(avatar)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border text-xl transition-colors ${
                        selectedAvatar === avatar ? "border-primary bg-primary/10" : "border-border bg-white hover:border-primary/40"
                      }`}
                      aria-label={`Choisir avatar ${avatar}`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>

                {gamification.progress && (
                  <div className="mt-4 rounded-xl border bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                      Progression de la semaine
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <p>{gamification.progress.weeklyPoints} / {gamification.progress.weeklyTargetPoints} pts</p>
                      <p className="text-muted-foreground">{gamification.progress.weeklyPercent}%</p>
                    </div>
                    <div className="mt-1 h-2 w-full rounded bg-muted">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{ width: `${Math.max(6, gamification.progress.weeklyPercent)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Aujourd&apos;hui: ~{gamification.progress.dailyPointsEstimate} pts
                    </p>
                    {gamification.progress.nextMilestone && (
                      <p className="text-xs text-muted-foreground">
                        Prochain jalon: {gamification.progress.nextMilestone.points} pts • {gamification.progress.nextMilestone.reward}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white/75 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                      Défis quotidiens
                    </p>
                    <div className="space-y-2">
                      {gamification.missions.map((mission) => {
                        const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                        return (
                          <div key={mission.id} className="rounded-lg border p-2">
                            <div className="flex items-center justify-between text-sm">
                              <p className="font-medium">{mission.label}</p>
                              <p className="text-muted-foreground">+{mission.reward} pts</p>
                            </div>
                            <div className="mt-1 h-2 w-full rounded bg-muted">
                              <div className="h-2 rounded bg-primary" style={{ width: `${Math.max(6, percent)}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {Math.min(mission.progress, mission.target)}/{mission.target} {mission.done ? "• Validé" : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white/75 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                      Classement hebdo
                    </p>
                    <div className="space-y-2">
                      {gamification.nearby.map((entry) => (
                        <div
                          key={`${entry.rank}-${entry.displayName}`}
                          className={`flex items-center justify-between rounded-lg border px-2 py-1.5 ${
                            entry.isCurrent ? "border-primary bg-primary/5" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm min-w-0">
                            <span className="text-lg">{AVATAR_EMOJIS[entry.avatar] || "🎯"}</span>
                            <span className="font-medium">#{entry.rank}</span>
                            <span className="truncate">{entry.displayName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{entry.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {todaySession && (
              <div className="soft-card rounded-2xl p-5 mb-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                      Session planifiee aujourd'hui
                    </p>
                    <p className="text-lg font-semibold">{todaySession.subject}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {todaySession.startTime} • {todaySession.durationMinutes} min
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => router.push(`/chat?id=${todaySession.conversationId}`)}>
                    Continuer dans le chat
                  </Button>
                </div>
              </div>
            )}

            {competencies.length > 0 && (
              <div className="soft-card rounded-2xl p-5 mb-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                  Progression par competence
                </p>
                <div className="space-y-2">
                  {competencies.map((item) => (
                    <div key={item.topic} className="rounded-lg border p-2">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-medium">{item.topic}</p>
                        <p className="text-muted-foreground">{item.percent}% ({item.correct}/{item.total})</p>
                      </div>
                      <div className="mt-1 h-2 w-full rounded bg-muted">
                        <div className="h-2 rounded bg-primary" style={{ width: `${Math.max(4, item.percent)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
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

              <button
                type="button"
                onClick={startDuel}
                className="soft-card rounded-2xl p-5 hover:border-primary/30 transition-colors group flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium">Défi & classement</p>
                  <p className="text-sm text-muted-foreground">
                    Fais le défi du jour et gagne des points
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
