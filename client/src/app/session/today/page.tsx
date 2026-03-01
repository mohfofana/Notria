"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  MessageCircle,
  Mic,
  PencilLine,
  SquarePen,
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

const STEP_LABELS: Record<GuidedSessionState, string> = {
  INTRO: "Accroche",
  EXPLAIN: "Explication",
  CHECK: "Verification",
  PRACTICE: "Exercice",
  VALIDATE: "Validation",
  NEXT_CONCEPT: "Transition",
  RECAP: "Recap",
};

const STATE_ORDER: Record<GuidedSessionState, number> = {
  INTRO: 1,
  EXPLAIN: 2,
  CHECK: 3,
  PRACTICE: 4,
  VALIDATE: 4,
  NEXT_CONCEPT: 5,
  RECAP: 6,
};

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

export default function SessionTodayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<GuidedStep | null>(null);
  const [progress, setProgress] = useState<GuidedSessionProgress | null>(null);
  const [pending, setPending] = useState(false);
  const [loadingNext, setLoadingNext] = useState(true);
  const [nextSession, setNextSession] = useState<NextProgramSessionResponse["data"] | null>(null);
  const [topic, setTopic] = useState("seance du jour");
  const [textAnswer, setTextAnswer] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [showQuestionBox, setShowQuestionBox] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmitResponse = useMemo(() => textAnswer.trim().length > 0, [textAnswer]);
  const currentScreen = step ? STATE_ORDER[step.state] ?? 1 : 0;
  const isFinalExercise = nextSession?.session?.type === "evaluation";

  useEffect(() => {
    const loadNextSession = async () => {
      setLoadingNext(true);
      try {
        const { data } = await api.get<NextProgramSessionResponse>("/course-program/next-session");
        const next = data?.data ?? null;
        setNextSession(next);
        if (next?.session?.topic) setTopic(next.session.topic);
      } catch {
        setNextSession(null);
      } finally {
        setLoadingNext(false);
      }
    };
    loadNextSession();
  }, []);

  async function startSession() {
    setPending(true);
    setError(null);
    try {
      const forcedProgramSessionIdRaw = searchParams.get("programSessionId");
      const forcedProgramSessionId = forcedProgramSessionIdRaw ? parseInt(forcedProgramSessionIdRaw, 10) : undefined;

      const defaultSessionId = nextSession?.session?.id;
      const programSessionId =
        forcedProgramSessionId && !Number.isNaN(forcedProgramSessionId)
          ? forcedProgramSessionId
          : defaultSessionId;

      const payload = programSessionId
        ? { courseProgramSessionId: programSessionId }
        : { topic: topic.trim().length > 0 ? topic.trim() : "seance du jour" };

      const { data } = await api.post("/guided-sessions/start", payload);
      setSessionId(data.sessionId);
      setStep(data.step);
      setProgress(data.progress);
      setTextAnswer("");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Impossible de demarrer la seance guidee.");
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
      if (choiceId === "ask_question") {
        setShowQuestionBox(false);
      }
    } catch {
      setError("Impossible d'envoyer ta reponse.");
    } finally {
      setPending(false);
    }
  }

  async function completeAndReturnToDashboard() {
    if (!sessionId) return;
    setPending(true);
    setError(null);
    try {
      await api.post(`/guided-sessions/${sessionId}/complete`);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Impossible de finaliser la session.");
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
        <p className="mb-2 text-sm font-semibold text-emerald-800">{step.visual.title || "Exercice"}</p>
        <p className="text-sm text-emerald-900">{step.visual.content}</p>
      </div>
    );
  }

  function renderInteraction() {
    if (!step || step.state === "RECAP") return null;

    // EXPLAIN = pas de champ texte, l'eleve utilise uniquement les boutons d'aide
    if (step.state === "EXPLAIN") return null;

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

  function renderSupportActions() {
    if (!step || step.state === "INTRO" || step.state === "RECAP") return null;

    const supportButtons: Array<{ id: string; label: string }> = [];

    if (step.state === "EXPLAIN") {
      supportButtons.push(
        { id: "not_understood", label: "Je n'ai pas compris" },
        { id: "understood_continue", label: "J'ai compris, on continue" },
        { id: "need_example", label: "Donne un exemple" },
        { id: "ask_question", label: "J'ai une question" },
      );
    } else if (step.state === "CHECK") {
      supportButtons.push(
        { id: "not_understood", label: "Je n'ai pas compris" },
        { id: "need_example", label: "Donne un exemple" },
        { id: "ask_question", label: "J'ai une question" },
      );
    } else if (step.state === "PRACTICE" || step.state === "VALIDATE") {
      supportButtons.push(
        { id: "need_hint", label: "Donne un indice" },
        { id: "need_example", label: "Donne un exemple" },
        { id: "not_understood", label: "Je n'ai pas compris" },
        { id: "ask_question", label: "J'ai une question" },
      );
    }

    if (supportButtons.length === 0) return null;

    return (
      <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Aides rapides
        </p>
        <div className="flex flex-wrap gap-2">
          {supportButtons.map((btn) => (
            <Button
              key={btn.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (btn.id === "ask_question") {
                  setShowQuestionBox((prev) => !prev);
                  return;
                }
                submit(btn.id);
              }}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {showQuestionBox && (
          <div className="space-y-2">
            <Input
              value={questionText}
              disabled={pending}
              onChange={(event) => setQuestionText(event.target.value)}
              placeholder="Ecris ta question..."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending || questionText.trim().length < 3}
                onClick={() => {
                  submit("ask_question", questionText.trim());
                  setQuestionText("");
                }}
              >
                Envoyer ma question
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled>
                <Mic className="h-4 w-4 mr-1" />
                Question vocale bientot
              </Button>
            </div>
          </div>
        )}
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
              Format actif: Accroche - Explication - Verification - Exercice - Recap.
            </p>
            {loadingNext ? (
              <p className="text-sm text-muted-foreground">Chargement de la prochaine micro-session...</p>
            ) : nextSession?.hasNextSession && nextSession.session ? (
              <div className="rounded-xl border bg-muted/30 p-3 text-sm space-y-1">
                <p className="font-medium">{nextSession.session.title}</p>
                <p className="text-muted-foreground">
                  {nextSession.weekTheme || nextSession.session.topic}
                </p>
                <p className="text-muted-foreground">
                  Duree: {nextSession.session.durationMinutes} min - {getTypeLabel(nextSession.session.type)}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Ordre strict: termine cette micro-session pour debloquer la suivante.
                </p>
                {isFinalExercise && (
                  <p className="text-xs font-semibold text-amber-800">
                    Exo final obligatoire: ce topic doit etre valide avant le prochain.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune session programme en attente, tu peux lancer une session libre.
              </p>
            )}
            <Input
              value={topic}
              disabled={pending || Boolean(nextSession?.hasNextSession)}
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
          <div className="text-xs text-muted-foreground">
            Termine la session en entier pour debloquer la micro-session suivante.
          </div>
          {isFinalExercise && (
            <div className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Exo final obligatoire de ce topic
            </div>
          )}
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
            <div className="flex items-start gap-3 rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500 text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-violet-600">Prof Ada</p>
                <p className="text-sm text-violet-900">{step.feedback}</p>
              </div>
            </div>
          )}

          {renderVisual()}
          {renderInteraction()}
          {renderSupportActions()}

          {step.state === "RECAP" && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-sm font-semibold text-emerald-900">Session terminee</p>
              <p className="text-sm text-emerald-900 mb-3">
                Termine pour valider cette micro-session dans ton programme.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={completeAndReturnToDashboard} disabled={pending}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Terminer
                </Button>
                <Button onClick={() => submit("restart")} disabled={pending}>
                  Encore 1 exercice
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
