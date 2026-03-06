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
  RefreshCw,
  Trophy,
  Swords,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";
import { ProfAdaAvatar } from "@/components/gamification/prof-ada-avatar";
import { XPCounter } from "@/components/gamification/xp-counter";
import { StreakFire } from "@/components/gamification/streak-fire";
import { ProgressCircle } from "@/components/gamification/progress-circle";
import { SubjectIcon } from "@/components/gamification/subject-icon";
import { LevelBadge } from "@/components/gamification/level-badge";
import { MissionCard } from "@/components/gamification/mission-card";

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

interface TodaySessionResponse {
  success: boolean;
  data: {
    hasSession: boolean;
    session?: { id: number; subject: string; startTime: string; durationMinutes: number; conversationId: number };
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
    leaderboard: Array<{ rank: number; displayName: string; points: number; league: string; avatar: string; isCurrent: boolean }>;
    nearby: Array<{ rank: number; displayName: string; points: number; league: string; avatar: string; isCurrent: boolean }>;
    missions: Array<{ id: string; label: string; progress: number; target: number; reward: number; done: boolean }>;
    progress: {
      dailyPointsEstimate: number;
      weeklyPoints: number;
      weeklyTargetPoints: number;
      weeklyPercent: number;
      nextMilestone: { points: number; reward: string } | null;
    };
  };
}

const AVATAR_EMOJIS: Record<string, string> = {
  "rocket-fox": "🦊", "tiger-math": "🐯", "eagle-scout": "🦅", "panther-logic": "🐆",
  "koala-wiz": "🐨", "falcon-pro": "🦉", "rhino-core": "🦏", "dolphin-brain": "🐬",
};
const AVATAR_CHOICES = Object.values(AVATAR_EMOJIS);

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  lesson: { label: "Cours", color: "bg-blue-100 text-blue-700" },
  exercise: { label: "Exercice", color: "bg-purple-100 text-purple-700" },
  quiz: { label: "Quiz", color: "bg-amber-100 text-amber-700" },
  recap: { label: "Recap", color: "bg-emerald-100 text-emerald-700" },
  revision: { label: "Revision", color: "bg-cyan-100 text-cyan-700" },
  evaluation: { label: "Evaluation", color: "bg-rose-100 text-rose-700" },
};

export default function DashboardPage() {
  const { user, student, linkedParents, hasSchedule, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [nextSession, setNextSession] = useState<NextProgramSessionResponse["data"] | null>(null);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [todaySession, setTodaySession] = useState<TodaySessionResponse["data"]["session"] | null>(null);
  const [competencies, setCompetencies] = useState<CompetencyProgressItem[]>([]);
  const [gamification, setGamification] = useState<GamificationResponse["data"] | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState("🦊");
  const [isStartingProgramSession, setIsStartingProgramSession] = useState(false);
  const [isStartingFreeQuestion, setIsStartingFreeQuestion] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "student") {
      const next = getNextOnboardingPath({ student, hasSchedule });
      if (next !== "/dashboard") router.replace(next);
    }
    if (!isLoading && isAuthenticated && user?.role === "parent") router.replace("/parent/dashboard");
    if (!isLoading && isAuthenticated && user?.role === "admin") router.replace("/admin");
  }, [isLoading, isAuthenticated, user, student, hasSchedule, router]);

  async function loadDashboardData() {
    setIsRefreshingData(true);
    try {
      const [nextSessionRes, homeworkRes, todaySessionRes, gamificationRes, competenciesRes] = await Promise.all([
        api.get<NextProgramSessionResponse>("/course-program/next-session"),
        api.get<TodayHomeworkResponse>("/sessions/homework/today"),
        api.get<TodaySessionResponse>("/sessions/today"),
        api.get<GamificationResponse>("/sessions/gamification"),
        api.get<{ success: boolean; data: CompetencyProgressItem[] }>("/sessions/competencies"),
      ]);
      setNextSession(nextSessionRes.data?.data ?? null);
      setHomeworkCount(homeworkRes.data?.data?.count ?? 0);
      setTodaySession(todaySessionRes.data?.data?.hasSession ? todaySessionRes.data?.data?.session ?? null : null);
      setCompetencies(competenciesRes.data?.data ?? []);
      setGamification(gamificationRes.data?.data ?? null);
    } catch {
      setNextSession(null); setHomeworkCount(0); setTodaySession(null); setCompetencies([]); setGamification(null);
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
    if (stored && AVATAR_CHOICES.includes(stored)) { setSelectedAvatar(stored); return; }
    if (gamification?.profile?.avatar) {
      const mapped = AVATAR_EMOJIS[gamification.profile.avatar];
      if (mapped) setSelectedAvatar(mapped);
    }
  }, [user, gamification]);

  function startProgramSession() {
    if (!nextSession?.session?.id) return;
    setIsStartingProgramSession(true);
    router.push(`/session/today?programSessionId=${nextSession.session.id}`);
  }

  async function startFreeQuestion() {
    setIsStartingFreeQuestion(true);
    try {
      const preferredSubject = student?.prioritySubjects?.[0] ?? "Mathématiques";
      const { data } = await api.post("/chat", { subject: preferredSubject, topic: "Question libre" });
      router.push(`/chat?id=${data.conversation.id}`);
    } catch { setIsStartingFreeQuestion(false); }
  }

  async function startDuel() {
    try {
      const preferredSubject = student?.prioritySubjects?.[0] ?? "Mathématiques";
      const { data } = await api.post("/chat", { subject: preferredSubject, topic: "Défi du jour" });
      router.push(`/chat?id=${data.conversation.id}&autostart=1&subject=${encodeURIComponent(preferredSubject)}&topic=${encodeURIComponent("Défi du jour")}`);
    } catch {}
  }

  function chooseAvatar(avatar: string) {
    setSelectedAvatar(avatar);
    if (user) window.localStorage.setItem(`notria-avatar-${user.id}`, avatar);
  }

  if (!user) return null;
  if (user.role === "student" && getNextOnboardingPath({ student, hasSchedule }) !== "/dashboard") return null;

  const profile = gamification?.profile;
  const progress = gamification?.progress;

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ProfAdaAvatar expression="happy" size="lg" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Salut {user.firstName} !
            </h1>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile && <StreakFire streak={profile.streak} size="md" />}
          {profile && <XPCounter value={profile.points} size="md" />}
          <Button variant="ghost" size="icon" onClick={loadDashboardData} disabled={isRefreshingData}>
            <RefreshCw className={`h-4 w-4 ${isRefreshingData ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {user.role === "student" && student ? (
        <>
          {/* Next Session Hero Card */}
          {nextSession?.hasNextSession && nextSession.session ? (
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-5 md:p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Prochaine session
                    </span>
                    {nextSession.weekNumber && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Semaine {nextSession.weekNumber}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[nextSession.session.type]?.color ?? ""}`}>
                      {TYPE_CONFIG[nextSession.session.type]?.label ?? nextSession.session.type}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{nextSession.session.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nextSession.weekTheme || nextSession.session.topic}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {nextSession.session.durationMinutes} min
                    </span>
                    {nextSession.session.status === "in_progress" && (
                      <span className="text-accent font-semibold">En cours</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="accent"
                  size="lg"
                  onClick={startProgramSession}
                  disabled={isStartingProgramSession}
                  className="shrink-0 soft-focus-ring"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {nextSession.session.status === "in_progress" ? "Continuer" : "Commencer"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card p-5 mb-6">
              <p className="font-medium">Aucune session en attente.</p>
              <p className="text-sm text-muted-foreground mt-1">Ton programme est termine ou pas encore genere.</p>
            </div>
          )}

          {/* Stats Row */}
          {profile && progress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="rounded-2xl border bg-card p-4 flex flex-col items-center gap-2">
                <ProgressCircle value={progress.weeklyPercent} size={56} strokeWidth={5} indicatorClassName="stroke-accent">
                  <span className="text-xs font-bold">{progress.weeklyPercent}%</span>
                </ProgressCircle>
                <p className="text-xs text-muted-foreground text-center">Semaine</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 flex flex-col items-center gap-2">
                <div className="text-2xl font-bold text-foreground">#{profile.rank}</div>
                <p className="text-xs text-muted-foreground">Classement</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 flex flex-col items-center gap-2">
                <LevelBadge league={profile.league} size="md" />
                <p className="text-xs text-muted-foreground">Ligue</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 flex flex-col items-center gap-2">
                <div className="text-2xl">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border bg-white text-xl cursor-pointer" title="Changer d'avatar">
                    {selectedAvatar}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Avatar</p>
              </div>
            </div>
          )}

          {/* Avatar Selector (compact) */}
          {profile && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {AVATAR_CHOICES.map((avatar) => (
                <button
                  type="button"
                  key={avatar}
                  onClick={() => chooseAvatar(avatar)}
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-lg transition-all ${
                    selectedAvatar === avatar
                      ? "border-accent bg-accent/10 scale-110 shadow-sm"
                      : "border-border bg-white hover:border-accent/40"
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          )}

          {/* Missions + Leaderboard Row */}
          {gamification && (
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {/* Missions */}
              <div className="rounded-2xl border bg-card p-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                  Defis quotidiens
                </h2>
                <div className="space-y-2">
                  {gamification.missions.map((m) => (
                    <MissionCard
                      key={m.id}
                      label={m.label}
                      current={m.progress}
                      target={m.target}
                      reward={m.reward}
                      completed={m.done}
                    />
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="rounded-2xl border bg-card p-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                  Classement
                </h2>
                <div className="space-y-1.5">
                  {gamification.nearby.map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.displayName}`}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                        entry.isCurrent ? "bg-accent/10 border border-accent/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        <span className="text-base">{AVATAR_EMOJIS[entry.avatar] || "🎯"}</span>
                        <span className="font-bold text-muted-foreground w-7">#{entry.rank}</span>
                        <span className={`truncate ${entry.isCurrent ? "font-semibold" : ""}`}>
                          {entry.displayName}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{entry.points} pts</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={startDuel}>
                  <Swords className="h-4 w-4 mr-1" /> Lancer un defi
                </Button>
              </div>
            </div>
          )}

          {/* Competency Progress */}
          {competencies.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                Competences
              </h2>
              <div className="space-y-3">
                {competencies.map((item) => (
                  <div key={item.topic}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{item.topic}</span>
                      <span className="text-muted-foreground text-xs">{item.percent}%</span>
                    </div>
                    <Progress
                      value={item.percent}
                      className="h-2"
                      indicatorClassName={item.percent >= 70 ? "bg-success" : item.percent >= 40 ? "bg-accent" : "bg-destructive"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Grid */}
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
            Actions rapides
          </h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
            <Link href="/programme" className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
              <p className="font-semibold text-sm">Programme</p>
              <p className="text-xs text-muted-foreground mt-0.5">Objectif : {student.targetScore}/20</p>
            </Link>

            <Link href="/homework/today" className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                <BookOpen className="h-5 w-5 text-purple-700" />
              </div>
              <p className="font-semibold text-sm">Devoirs</p>
              <p className="text-xs text-muted-foreground mt-0.5">{homeworkCount} exercice(s)</p>
            </Link>

            <button type="button" onClick={startFreeQuestion} disabled={isStartingFreeQuestion} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all text-left disabled:opacity-70">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-emerald-700" />
              </div>
              <p className="font-semibold text-sm">Question libre</p>
              <p className="text-xs text-muted-foreground mt-0.5">{isStartingFreeQuestion ? "Ouverture..." : "Demander a Prof Ada"}</p>
            </button>

            <Link href="/notria-vision" className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <Camera className="h-5 w-5 text-orange-700" />
              </div>
              <p className="font-semibold text-sm">Notria Vision</p>
              <p className="text-xs text-muted-foreground mt-0.5">Photo et correction</p>
            </Link>

            <Link href="/examens" className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-rose-700" />
              </div>
              <p className="font-semibold text-sm">{student.examType} Blanc</p>
              <p className="text-xs text-muted-foreground mt-0.5">Simulation</p>
            </Link>

            <Link href="/paiement" className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-amber-700" />
              </div>
              <p className="font-semibold text-sm">Abonnement</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gerer ton plan</p>
            </Link>
          </div>

          {/* Parent link code */}
          <div className="mt-6 rounded-2xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Code parent</p>
            <p className="text-sm">
              Code de liaison: <span className="font-mono font-bold tracking-wider">{student.inviteCode}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Parents lies: {linkedParents.length}</p>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Le tableau de bord parent arrive bientot</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tu pourras bientot suivre les progres de ton enfant.
          </p>
          <Link href="/parent" className="inline-flex mt-4">
            <Button variant="outline">Voir la vue parent</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
