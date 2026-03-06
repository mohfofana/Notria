"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Lightbulb,
  Loader2,
  Lock,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface DomainAssessment {
  domain: string;
  level: string;
  percentage: number;
}

interface TopicFocus {
  topic: string;
  priority: "high" | "medium" | "low";
  hoursAllocated: number;
}

interface SessionContent {
  keyConcepts: string[];
  exercises: string[];
  ragSources: string[];
}

interface ProgramSession {
  id: number;
  weekId: number;
  dayNumber: number;
  sessionOrder: number;
  topic: string;
  type: "lesson" | "exercise" | "quiz" | "recap" | "revision" | "evaluation";
  engagementMode: "discovery" | "quick_win" | "challenge" | "exam_drill";
  title: string;
  description?: string;
  durationMinutes: number;
  difficulty: "facile" | "moyen" | "difficile";
  content?: SessionContent;
  objectives?: string[];
  status: "upcoming" | "in_progress" | "completed" | "skipped";
  completedAt?: string;
  scoreAtCompletion?: number;
}

interface ProgramWeek {
  id: number;
  programId: number;
  weekNumber: number;
  theme: string;
  objectives: string[];
  focusTopics: TopicFocus[];
  status: "upcoming" | "in_progress" | "completed";
  sessions: ProgramSession[];
}

interface ProgramData {
  id: number;
  studentId: number;
  title: string;
  totalWeeks: number;
  startDate: string;
  endDate: string;
  weeklySessionCount: number;
  sessionDurationMinutes: number;
  overallLevel: string;
  weaknesses: DomainAssessment[];
  strengths: DomainAssessment[];
  recommendations?: {
    summary: string;
    weeklyThemes: string[];
    tips: string[];
    motivation: string;
  };
  status: "active" | "completed" | "abandoned";
  weeks: ProgramWeek[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getPriorityColor(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high": return "bg-red-100 text-red-700 border-red-200";
    case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "low": return "bg-green-100 text-green-700 border-green-200";
  }
}

function getPriorityLabel(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high": return "Prioritaire";
    case "medium": return "A approfondir";
    case "low": return "Maintien";
  }
}

function getTypeIcon(type: ProgramSession["type"]) {
  switch (type) {
    case "lesson": return <BookOpen className="h-4 w-4" />;
    case "exercise": return <Brain className="h-4 w-4" />;
    case "quiz": return <Zap className="h-4 w-4" />;
    case "recap": return <Lightbulb className="h-4 w-4" />;
    case "revision": return <TrendingUp className="h-4 w-4" />;
    case "evaluation": return <Trophy className="h-4 w-4" />;
  }
}

function getTypeColor(type: ProgramSession["type"]) {
  switch (type) {
    case "lesson": return "bg-blue-100 text-blue-700";
    case "exercise": return "bg-purple-100 text-purple-700";
    case "quiz": return "bg-amber-100 text-amber-700";
    case "recap": return "bg-teal-100 text-teal-700";
    case "revision": return "bg-orange-100 text-orange-700";
    case "evaluation": return "bg-emerald-100 text-emerald-700";
  }
}

function getTypeLabel(type: ProgramSession["type"]) {
  switch (type) {
    case "lesson": return "Cours";
    case "exercise": return "Exercices";
    case "quiz": return "Quiz";
    case "recap": return "Recap";
    case "revision": return "Revision";
    case "evaluation": return "Evaluation";
  }
}

function getEngagementModeStyle(mode: ProgramSession["engagementMode"]) {
  switch (mode) {
    case "discovery":
      return { label: "Discovery", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    case "quick_win":
      return { label: "Quick win", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "challenge":
      return { label: "Challenge", cls: "bg-orange-50 text-orange-700 border-orange-200" };
    case "exam_drill":
      return { label: "Exam drill", cls: "bg-red-50 text-red-700 border-red-200" };
  }
}

function getDifficultyLabel(d: "facile" | "moyen" | "difficile") {
  switch (d) {
    case "facile": return "Fondamental";
    case "moyen": return "Intermediaire";
    case "difficile": return "Avance";
  }
}

function getDifficultyColor(d: "facile" | "moyen" | "difficile") {
  switch (d) {
    case "facile": return "text-green-600";
    case "moyen": return "text-yellow-600";
    case "difficile": return "text-red-600";
  }
}

function getWeekStatusIcon(status: ProgramWeek["status"]) {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "in_progress": return <Play className="h-5 w-5 text-primary" />;
    case "upcoming": return <Lock className="h-5 w-5 text-muted-foreground" />;
  }
}

function getLevelLabel(level: string) {
  if (level.includes("debutant")) return "Debutant";
  if (level.includes("intermediaire")) return "Intermediaire";
  if (level.includes("avance")) return "Avance";
  return level;
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProgrammePage() {
  const router = useRouter();
  const { user, student, isLoading: authLoading } = useAuth();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadProgram();
    }
  }, [authLoading, user]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/course-program/current");
      if (data.success && data.data) {
        setProgram(data.data);
        // Auto-expand the current week
        const currentWeek = data.data.weeks.find(
          (w: ProgramWeek) => w.status === "in_progress",
        );
        if (currentWeek) setExpandedWeek(currentWeek.weekNumber);
      }
    } catch (err) {
      console.error("Failed to load program:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute overall completion
  const totalSessions = program?.weeks.reduce(
    (sum, w) => sum + w.sessions.length,
    0,
  ) ?? 0;
  const completedSessions = program?.weeks.reduce(
    (sum, w) => sum + w.sessions.filter((s) => s.status === "completed").length,
    0,
  ) ?? 0;
  const completionPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // ── Loading State ────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement du programme...</p>
        </div>
      </div>
    );
  }

  // ── No Program State → Generate ──────────────────────────────────────────

  if (!program) {
    return (
      <div className="px-4 py-6 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Programme en preparation</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ton programme est genere par Prof Ada apres ton assessment.
              Il apparaitra ici des qu&apos;il est pret.
            </p>
            <p className="text-sm text-muted-foreground">
              Si ce message persiste, retourne au dashboard puis reessaie dans quelques instants.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Program View ─────────────────────────────────────────────────────────

  const recs = program.recommendations;

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mon Programme</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{program.totalWeeks} semaines</span>
          </div>
        </div>

        {/* Title & Overview */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{program.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Objectif : {student?.targetScore ?? 14}/20
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {program.weeklySessionCount} sessions/semaine
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              Niveau : {getLevelLabel(program.overallLevel)}
            </span>
          </div>
        </div>

        {/* AI Summary Card */}
        {recs && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary mb-1">Prof Ada dit :</p>
                  <p className="text-sm">{recs.summary}</p>
                  {recs.motivation && (
                    <p className="text-sm mt-2 italic text-primary/80">{recs.motivation}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression globale</span>
              <span className="text-sm text-muted-foreground">
                {completedSessions}/{totalSessions} sessions ({completionPercent}%)
              </span>
            </div>
            <Progress value={completionPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Weaknesses & Strengths Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {program.weaknesses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                  <TrendingUp className="h-4 w-4" />
                  A renforcer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {program.weaknesses.map((w: DomainAssessment) => (
                    <div
                      key={w.domain}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{w.domain}</span>
                      <span className="text-red-600 font-medium">{w.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {program.strengths.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Points forts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {program.strengths.map((s: DomainAssessment) => (
                    <div
                      key={s.domain}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{s.domain}</span>
                      <span className="text-emerald-600 font-medium">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tips */}
        {recs?.tips && recs.tips.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-accent" />
                <span className="font-semibold">Conseils pour reussir</span>
              </div>
              <ul className="space-y-2">
                {recs.tips.map((tip: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Weekly Breakdown */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Programme semaine par semaine
          </h2>

          {program.weeks.map((week) => {
            const isExpanded = expandedWeek === week.weekNumber;
            const weekCompleted = week.sessions.filter((s) => s.status === "completed").length;
            const weekTotal = week.sessions.length;
            const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

            return (
              <div key={week.weekNumber} className="rounded-2xl border bg-card overflow-hidden">
                {/* Week Header - Clickable */}
                <button
                  type="button"
                  onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                >
                  {getWeekStatusIcon(week.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Semaine {week.weekNumber}</span>
                      {week.status === "in_progress" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          En cours
                        </span>
                      )}
                      {week.status === "completed" && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          Termine
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{week.theme}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={weekPercent} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {weekCompleted}/{weekTotal}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Week Details - Expanded */}
                {isExpanded && (
                  <div className="border-t px-5 pb-5 space-y-4">
                    {/* Week Objectives */}
                    {week.objectives.length > 0 && (
                      <div className="pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Objectifs de la semaine
                        </p>
                        <ul className="space-y-1">
                          {week.objectives.map((obj: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <Target className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Focus Topics */}
                    {week.focusTopics.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Chapitres de la semaine
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {week.focusTopics.map((ft: TopicFocus) => (
                            <span
                              key={ft.topic}
                              className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getPriorityColor(ft.priority)}`}
                            >
                              {ft.topic} — {getPriorityLabel(ft.priority)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sessions List grouped by day */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Micro-sessions ({week.sessions.length})
                      </p>
                      {Object.entries(
                        week.sessions.reduce((acc, s) => {
                          if (!acc[s.dayNumber]) acc[s.dayNumber] = [];
                          acc[s.dayNumber].push(s);
                          return acc;
                        }, {} as Record<number, ProgramSession[]>)
                      )
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([day, daySessions]) => (
                          <div key={day} className="rounded-xl border bg-muted/20 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                              Jour {day} - {daySessions.length} micro-sessions
                            </p>
                            <div className="space-y-2">
                              {daySessions
                                .sort((a, b) => a.sessionOrder - b.sessionOrder)
                                .map((session) => {
                                  const mode = getEngagementModeStyle(session.engagementMode);
                                  return (
                                    <div
                                      key={session.id}
                                      className={`rounded-xl border p-4 transition-colors ${
                                        session.status === "completed"
                                          ? "bg-emerald-50/50 border-emerald-200/60 opacity-80"
                                          : "bg-white/80 hover:border-primary/30"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(session.type)}`}>
                                          {getTypeIcon(session.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{session.title}</span>
                                            <span className={`text-xs ${getDifficultyColor(session.difficulty)}`}>
                                              {getDifficultyLabel(session.difficulty)}
                                            </span>
                                          </div>
                                          {session.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {session.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                              <Clock className="h-3.5 w-3.5" />
                                              {session.durationMinutes} min
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded ${getTypeColor(session.type)} text-xs`}>
                                              {getTypeLabel(session.type)}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded border text-xs ${mode.cls}`}>
                                              {mode.label}
                                            </span>
                                            {session.status === "completed" && (
                                              <span className="flex items-center gap-1 text-emerald-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Termine
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {session.status === "in_progress" && (
                                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">
                                            A faire depuis le dashboard
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Continue */}
        <div className="text-center pt-4 pb-8">
          <Link href="/dashboard">
            <Button size="lg">
              Continuer vers le dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
