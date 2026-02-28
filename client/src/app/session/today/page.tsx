"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Mic,
  PencilLine,
  SquarePen,
  SquareSigma,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type GuidedSessionState =
  | "INTRO"
  | "EXPLAIN"
  | "CHECK"
  | "PRACTICE"
  | "VALIDATE"
  | "NEXT_CONCEPT"
  | "RECAP";

type GuidedInteractionType = "choice" | "short_text" | "number" | "voice_or_text";
type GuidedVisualType = "formula" | "diagram" | "exercise_card";

interface GuidedChoiceOption {
  id: string;
  label: string;
}

interface GuidedStepVisual {
  type: GuidedVisualType;
  title?: string;
  content: string;
}

interface GuidedStepInteraction {
  type: GuidedInteractionType;
  ctaLabel: string;
  placeholder?: string;
  choices?: GuidedChoiceOption[];
}

interface GuidedStep {
  id: string;
  state: GuidedSessionState;
  coachLines: string[];
  prompt: string;
  visual?: GuidedStepVisual;
  interaction: GuidedStepInteraction;
  feedback?: string;
}

interface GuidedSessionProgress {
  correctAnswers: number;
  totalChecks: number;
  completionPercent: number;
}

interface TodaySessionApiResponse {
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

const STEP_ORDER: Record<string, number> = {
  "intro-level": 1,
  "explain-context": 2,
  "formula-gate": 3,
  "angle-90-explain": 3,
  "check-ac2": 4,
  "check-ac2-hint": 4,
  "check-ac": 4,
  "practice-step-1": 5,
  "practice-step-2": 5,
  "practice-step-3": 5,
  recap: 6,
};

const STEP_LABELS: Record<GuidedSessionState, string> = {
  INTRO: "Accroche",
  EXPLAIN: "Explication",
  CHECK: "Verification",
  PRACTICE: "Exercice",
  VALIDATE: "Validation",
  NEXT_CONCEPT: "Transition",
  RECAP: "Recap",
};

export default function SessionTodayPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<GuidedStep | null>(null);
  const [progress, setProgress] = useState<GuidedSessionProgress | null>(null);
  const [scheduledSession, setScheduledSession] = useState<TodaySessionApiResponse["data"]["session"]>();
  const [pending, setPending] = useState(false);
  const [loadingToday, setLoadingToday] = useState(true);
  const [topic, setTopic] = useState("seance du jour");
  const [textAnswer, setTextAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmitResponse = useMemo(() => textAnswer.trim().length > 0, [textAnswer]);
  const currentScreen = step ? STEP_ORDER[step.id] ?? 1 : 0;

  useEffect(() => {
    const loadTodaySession = async () => {
      setLoadingToday(true);
      try {
        const { data } = await api.get<TodaySessionApiResponse>("/sessions/today");
        const session = data?.data?.session;
        setScheduledSession(session);
        if (session?.subject) setTopic(session.subject);
      } catch {
        setScheduledSession(undefined);
      } finally {
        setLoadingToday(false);
      }
    };
    loadTodaySession();
  }, []);

  async function startSession() {
    setPending(true);
    setError(null);
    try {
      if (scheduledSession?.id) {
        await api.post("/sessions/start", { sessionId: scheduledSession.id });
      }
      const sessionTopic = topic.trim().length > 0 ? topic.trim() : "seance du jour";
      const { data } = await api.post("/guided-sessions/start", { topic: sessionTopic });
      setSessionId(data.sessionId);
      setStep(data.step);
      setProgress(data.progress);
      setTextAnswer("");
    } catch {
      setError("Impossible de demarrer la seance guidee.");
    } finally {
      setPending(false);
    }
  }

  async function submit(choiceId?: string, response?: string) {
    if (!sessionId || !step) return;
    setPending(true);
    setError(null);
    try {
      const { data } = await api.post(`/guided-sessions/${sessionId}/respond`, { choiceId, response });
      setStep(data.step);
      setProgress(data.progress);
      setTextAnswer("");
    } catch {
      setError("Impossible d'envoyer ta reponse.");
    } finally {
      setPending(false);
    }
  }

  function renderVisual() {
    if (!step?.visual) return null;

    if (step.visual.type === "formula") {
      return (
        <div className="rounded-2xl border-2 border-slate-900 bg-slate-950 p-5 text-center text-slate-100">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-400">
            {step.visual.title || "Tableau"}
          </p>
          <p className="font-mono text-3xl font-semibold">{step.visual.content}</p>
        </div>
      );
    }

    if (step.visual.type === "diagram") {
      return (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-slate-700">{step.visual.title || "Schema"}</p>
          <pre className="overflow-auto rounded-xl bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800">
            {step.visual.content}
          </pre>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
        <p className="mb-2 text-sm font-semibold text-emerald-800">{step.visual.title || "Exercice type BEPC"}</p>
        <p className="text-sm text-emerald-900">{step.visual.content}</p>
      </div>
    );
  }

  function renderInteraction() {
    if (!step) return null;

    if (step.interaction.type === "choice") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {step.interaction.choices?.map((choice) => (
            <Button
              key={choice.id}
              variant="outline"
              className="h-auto min-h-12 justify-start whitespace-normal border-2 px-4 py-3 text-left"
              disabled={pending}
              onClick={() => submit(choice.id)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      );
    }

    const inputType = step.interaction.type === "number" ? "number" : "text";

    return (
      <div className="space-y-3">
        {step.interaction.type === "voice_or_text" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" type="button" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Repondre vocalement
            </Button>
            <Badge variant="outline">Mode vocal bientot</Badge>
          </div>
        )}

        <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Ta reponse</p>
          <Input
            type={inputType}
            value={textAnswer}
            disabled={pending}
            onChange={(event) => setTextAnswer(event.target.value)}
            placeholder={step.interaction.placeholder || "Entre ta reponse"}
          />
        </div>

        <Button
          className="w-full"
          disabled={pending || !canSubmitResponse}
          onClick={() => submit(undefined, textAnswer)}
        >
          {step.interaction.type === "number" ? (
            <PencilLine className="mr-2 h-4 w-4" />
          ) : (
            <SquarePen className="mr-2 h-4 w-4" />
          )}
          {step.interaction.ctaLabel}
        </Button>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Seance Notria guidee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Format actif: Accroche → Explication → Verification → Exercice → Recap.
            </p>
            {loadingToday ? (
              <p className="text-sm text-muted-foreground">Chargement de la seance du jour...</p>
            ) : scheduledSession ? (
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{scheduledSession.subject}</p>
                <p className="text-muted-foreground">Duree: {scheduledSession.durationMinutes} min</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune seance planifiee, tu peux lancer une seance libre.</p>
            )}
            <Input
              value={topic}
              disabled={pending}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Sujet de la seance"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={startSession} disabled={pending}>
              Demarrer la seance guidee
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/80 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Prof Ada - seance guidee</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Ecran {currentScreen}/6</Badge>
              <Badge variant="outline">{STEP_LABELS[step.state]}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Score: {progress?.correctAnswers ?? 0}/{progress?.totalChecks ?? 0}</span>
            <span>Progression: {progress?.completionPercent ?? 0}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              {step.coachLines.map((line, index) => (
                <p key={`${step.id}-${index}`} className="text-sm">
                  {line}
                </p>
              ))}
              <p className="text-sm font-semibold">{step.prompt}</p>
            </div>
          </div>

          {step.feedback && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {step.feedback}
            </div>
          )}

          {renderVisual()}

          {step.id === "check-ac2" && (
            <div className="rounded-xl border bg-slate-50 p-4 text-sm font-mono">
              <p>AC^2 = AB^2 + BC^2</p>
              <p>AC^2 = 3^2 + 4^2</p>
              <p>AC^2 = ?</p>
            </div>
          )}

          {step.id.startsWith("practice-step") && (
            <div className="rounded-xl border bg-white p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border p-2">Etape 1: Ecris la formule</div>
                <div className="rounded-lg border p-2">Etape 2: Remplace les valeurs</div>
                <div className="rounded-lg border p-2">Etape 3: Calcule AC</div>
              </div>
            </div>
          )}

          {renderInteraction()}

          {step.state === "RECAP" && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-sm font-semibold text-emerald-900">Ce qu'on a vu</p>
              <div className="space-y-1 text-sm text-emerald-900">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Theoreme de Pythagore</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> AC^2 = AB^2 + BC^2</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Triangle rectangle uniquement</p>
                <p className="flex items-center gap-2"><SquareSigma className="h-4 w-4" /> Penser a la racine a la fin</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>Terminer</Button>
                <Button onClick={startSession} disabled={pending}>Encore 1 exercice</Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
