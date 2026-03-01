"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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

interface DomainAssessment { domain: string; level: string; percentage: number; }
interface TopicFocus { topic: string; priority: "high" | "medium" | "low"; hoursAllocated: number; }
interface SessionContent { keyConcepts: string[]; exercises: string[]; ragSources: string[]; }

interface ProgramSession {
  id: number; weekId: number; dayNumber: number; sessionOrder: number;
  topic: string; type: "lesson" | "exercise" | "quiz" | "recap" | "revision" | "evaluation";
  engagementMode: "discovery" | "quick_win" | "challenge" | "exam_drill";
  title: string; description?: string; durationMinutes: number;
  difficulty: "facile" | "moyen" | "difficile"; content?: SessionContent;
  objectives?: string[]; status: "upcoming" | "in_progress" | "completed" | "skipped";
  completedAt?: string; scoreAtCompletion?: number;
}

interface ProgramWeek {
  id: number; programId: number; weekNumber: number; theme: string;
  objectives: string[]; focusTopics: TopicFocus[];
  status: "upcoming" | "in_progress" | "completed"; sessions: ProgramSession[];
}

interface ProgramData {
  id: number; studentId: number; title: string; totalWeeks: number;
  startDate: string; endDate: string; weeklySessionCount: number;
  sessionDurationMinutes: number; overallLevel: string;
  weaknesses: DomainAssessment[]; strengths: DomainAssessment[];
  recommendations?: { summary: string; weeklyThemes: string[]; tips: string[]; motivation: string; };
  status: "active" | "completed" | "abandoned"; weeks: ProgramWeek[];
}

const priorityConfig = {
  high: { label: "Prioritaire", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "A approfondir", cls: "bg-warning/10 text-warning-foreground border-warning/20" },
  low: { label: "Maintien", cls: "bg-accent/10 text-accent border-accent/20" },
};

const typeConfig: Record<ProgramSession["type"], { label: string; icon: typeof BookOpen; color: string }> = {
  lesson: { label: "Cours", icon: BookOpen, color: "bg-info/12 text-info" },
  exercise: { label: "Exercices", icon: Brain, color: "bg-purple-100 text-purple-700" },
  quiz: { label: "Quiz", icon: Zap, color: "bg-amber-100 text-amber-700" },
  recap: { label: "Recap", icon: Lightbulb, color: "bg-muted text-muted-foreground" },
  revision: { label: "Revision", icon: TrendingUp, color: "bg-secondary text-secondary-foreground" },
  evaluation: { label: "Evaluation", icon: Trophy, color: "bg-primary/10 text-primary" },
};

const modeConfig: Record<ProgramSession["engagementMode"], { label: string; cls: string }> = {
  discovery: { label: "Discovery", cls: "bg-info/8 text-info border-info/20" },
  quick_win: { label: "Quick win", cls: "bg-accent/8 text-accent border-accent/20" },
  challenge: { label: "Challenge", cls: "bg-warning/8 text-warning-foreground border-warning/20" },
  exam_drill: { label: "Exam drill", cls: "bg-destructive/8 text-destructive border-destructive/20" },
};

const difficultyConfig = {
  facile: { label: "Fondamental", cls: "text-accent" },
  moyen: { label: "Intermediaire", cls: "text-warning-foreground" },
  difficile: { label: "Avance", cls: "text-destructive" },
};

export default function ProgrammePage() {
  const router = useRouter();
  const { user, student, isLoading: authLoading } = useAuth();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      (async () => {
        try {
          setLoading(true);
          const { data } = await api.get("/course-program/current");
          if (data.success && data.data) {
            setProgram(data.data);
            const cw = data.data.weeks.find((w: ProgramWeek) => w.status === "in_progress");
            if (cw) setExpandedWeek(cw.weekNumber);
          }
        } catch { /* ignore */ }
        finally { setLoading(false); }
      })();
    }
  }, [authLoading, user]);

  const totalSessions = program?.weeks.reduce((s, w) => s + w.sessions.length, 0) ?? 0;
  const completedSessions = program?.weeks.reduce((s, w) => s + w.sessions.filter((x) => x.status === "completed").length, 0) ?? 0;
  const pct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du programme...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6 text-center py-12 animate-fade-in">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Programme en preparation</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Prof Ada prepare ton programme personnalise. Il apparaitra ici des qu'il sera pret.
        </p>
      </div>
    );
  }

  const recs = program.recommendations;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="font-display text-xl font-bold">{program.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {program.totalWeeks} semaines
          </span>
          <span className="inline-flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            Objectif: {student?.targetScore ?? 14}/20
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {program.weeklySessionCount} sessions/sem
          </span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Progression globale</span>
          <span className="text-xs text-muted-foreground">{completedSessions}/{totalSessions} ({pct}%)</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* AI summary */}
      {recs && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Prof Ada dit :</p>
              <p className="text-sm">{recs.summary}</p>
              {recs.motivation && (
                <p className="text-sm mt-2 italic text-primary/70">{recs.motivation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {(program.weaknesses.length > 0 || program.strengths.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {program.weaknesses.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> A renforcer
              </p>
              <div className="space-y-1.5">
                {program.weaknesses.map((w) => (
                  <div key={w.domain} className="flex items-center justify-between text-xs">
                    <span className="truncate">{w.domain}</span>
                    <span className="font-semibold text-destructive">{w.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {program.strengths.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Points forts
              </p>
              <div className="space-y-1.5">
                {program.strengths.map((s) => (
                  <div key={s.domain} className="flex items-center justify-between text-xs">
                    <span className="truncate">{s.domain}</span>
                    <span className="font-semibold text-accent">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {recs?.tips && recs.tips.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-warning" /> Conseils
          </p>
          <ul className="space-y-1.5">
            {recs.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-bold">Semaine par semaine</h2>

        {program.weeks.map((week) => {
          const expanded = expandedWeek === week.weekNumber;
          const wDone = week.sessions.filter((s) => s.status === "completed").length;
          const wTotal = week.sessions.length;
          const wPct = wTotal > 0 ? Math.round((wDone / wTotal) * 100) : 0;

          return (
            <div key={week.weekNumber} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedWeek(expanded ? null : week.weekNumber)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                {week.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                ) : week.status === "in_progress" ? (
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-primary animate-pulse-ring" />
                ) : (
                  <Lock className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Semaine {week.weekNumber}</span>
                    {week.status === "in_progress" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">En cours</span>
                    )}
                    {week.status === "completed" && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">Termine</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{week.theme}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={wPct} className="h-1 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{wDone}/{wTotal}</span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded && (
                <div className="border-t border-border px-4 pb-4 space-y-4">
                  {week.objectives.length > 0 && (
                    <div className="pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Objectifs</p>
                      <ul className="space-y-1">
                        {week.objectives.map((obj, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <Target className="h-3 w-3 mt-0.5 text-primary shrink-0" />{obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {week.focusTopics.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Chapitres</p>
                      <div className="flex flex-wrap gap-1.5">
                        {week.focusTopics.map((ft) => (
                          <span key={ft.topic} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${priorityConfig[ft.priority].cls}`}>
                            {ft.topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sessions by day */}
                  {Object.entries(
                    week.sessions.reduce((acc, s) => { (acc[s.dayNumber] ??= []).push(s); return acc; }, {} as Record<number, ProgramSession[]>)
                  )
                    .sort(([a], [b]) => +a - +b)
                    .map(([day, sessions]) => (
                      <div key={day}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Jour {day}
                        </p>
                        <div className="space-y-1.5">
                          {sessions.sort((a, b) => a.sessionOrder - b.sessionOrder).map((s) => {
                            const tc = typeConfig[s.type];
                            const Icon = tc.icon;
                            return (
                              <div
                                key={s.id}
                                className={`rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                                  s.status === "completed"
                                    ? "bg-accent/5 border-accent/20 opacity-75"
                                    : "bg-card hover:border-primary/20"
                                }`}
                              >
                                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tc.color}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-tight">{s.title}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />{s.durationMinutes}min
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${tc.color}`}>{tc.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${modeConfig[s.engagementMode].cls}`}>{modeConfig[s.engagementMode].label}</span>
                                    <span className={`text-[10px] font-medium ${difficultyConfig[s.difficulty].cls}`}>{difficultyConfig[s.difficulty].label}</span>
                                    {s.status === "completed" && (
                                      <span className="text-[10px] text-accent font-medium inline-flex items-center gap-0.5">
                                        <CheckCircle2 className="h-3 w-3" />Fait
                                      </span>
                                    )}
                                    {s.status === "in_progress" && (
                                      <span className="text-[10px] text-primary font-semibold">En cours</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
