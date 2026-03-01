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
  Play,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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

interface GuidedChoiceOption { id: string; label: string; }
interface GuidedStepVisual { type: GuidedVisualType; title?: string; content: string; }
interface GuidedStepInteraction { type: GuidedInteractionType; ctaLabel: string; placeholder?: string; choices?: GuidedChoiceOption[]; }
interface GuidedStep { id: string; state: GuidedSessionState; coachLines: string[]; prompt: string; visual?: GuidedStepVisual; interaction: GuidedStepInteraction; feedback?: string; }
interface GuidedSessionProgress { correctAnswers: number; totalChecks: number; completionPercent: number; }

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
  data: { hasNextSession: boolean; weekNumber?: number; weekTheme?: string; session?: ProgramSession; };
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
  INTRO: 1, EXPLAIN: 2, CHECK: 3, PRACTICE: 4, VALIDATE: 4, NEXT_CONCEPT: 5, RECAP: 6,
};

const typeConfig: Record<ProgramSession["type"], { label: string; color: string }> = {
  lesson: { label: "Cours", color: "bg-info/12 text-info" },
  exercise: { label: "Exercice", color: "bg-purple-100 text-purple-700" },
  quiz: { label: "Quiz", color: "bg-amber-100 text-amber-700" },
  recap: { label: "Recap", color: "bg-muted text-muted-foreground" },
  revision: { label: "Revision", color: "bg-muted text-muted-foreground" },
  evaluation: { label: "Evaluation", color: "bg-primary/10 text-primary" },
};

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
    (async () => {
      setLoadingNext(true);
      try {
        const { data } = await api.get<NextProgramSessionResponse>("/course-program/next-session");
        const next = data?.data ?? null;
        setNextSession(next);
        if (next?.session?.topic) setTopic(next.session.topic);
      } catch { setNextSession(null); }
      finally { setLoadingNext(false); }
    })();
  }, []);

  async function startSession() {
    setPending(true);
    setError(null);
    try {
      const forcedId = searchParams.get("programSessionId");
      const forcedProgramSessionId = forcedId ? parseInt(forcedId, 10) : undefined;
      const defaultSessionId = nextSession?.session?.id;
      const programSessionId =
        forcedProgramSessionId && !Number.isNaN(forcedProgramSessionId)
          ? forcedProgramSessionId : defaultSessionId;
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
    } finally { setPending(false); }
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
      if (choiceId === "ask_question") setShowQuestionBox(false);
    } catch { setError("Impossible d'envoyer ta reponse."); }
    finally { setPending(false); }
  }

  async function completeAndReturn() {
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

  /* ─── Pre-session screen ─── */
  if (!step) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold">Session guidee</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accroche → Explication → Verification → Exercice → Recap
          </p>
        </div>

        {loadingNext ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : nextSession?.hasNextSession && nextSession.session ? (
          <div className="rounded-2xl border border-border bg-card p-5 animate-scale-in">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Prochaine micro-session
              </span>
              {nextSession.weekNumber && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  Semaine {nextSession.weekNumber}
                </span>
              )}
            </div>

            <h2 className="font-display text-lg font-semibold">{nextSession.session.title}</h2>
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
            </div>

            {isFinalExercise && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
                Exo final — Valide ce topic pour passer au suivant
              </div>
            )}

            <Button onClick={startSession} disabled={pending} size="lg" className="mt-5 w-full">
              <Play className="h-4 w-4" />
              {pending ? "Demarrage..." : nextSession.session.status === "in_progress" ? "Continuer" : "Commencer la session"}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 animate-scale-in">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-center">Pas de session programme</p>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
              Lance une session libre sur le sujet de ton choix.
            </p>
            <Input
              value={topic}
              disabled={pending}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Sujet de la seance"
              className="mb-3"
            />
            <Button onClick={startSession} disabled={pending} size="lg" className="w-full">
              <Play className="h-4 w-4" />
              {pending ? "Demarrage..." : "Demarrer la seance"}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    );
  }

  /* ─── In-session ─── */
  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold">Prof Ada</span>
            <Badge variant="outline" className="text-[10px]">{STEP_LABELS[step.state]}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{progress?.correctAnswers ?? 0}/{progress?.totalChecks ?? 0}</span>
            <span>Etape {currentScreen}/6</span>
          </div>
        </div>
        <Progress value={progress?.completionPercent ?? 0} className="h-1.5" />
        {isFinalExercise && (
          <p className="mt-2 text-[10px] font-semibold text-amber-700">Exo final obligatoire</p>
        )}
      </div>

      {/* Coach message */}
      <div className="flex gap-3">
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2 rounded-2xl rounded-tl-md border border-border bg-card p-4">
          {step.coachLines.map((line, i) => (
            <p key={`${step.id}-${i}`} className="text-sm leading-relaxed">{line}</p>
          ))}
          <p className="text-sm font-semibold leading-relaxed">{step.prompt}</p>
        </div>
      </div>

      {/* Feedback bubble */}
      {step.feedback && (
        <div className="flex gap-3 ml-12">
          <div className="flex-1 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Prof Ada</span>
            </div>
            <p className="text-sm">{step.feedback}</p>
          </div>
        </div>
      )}

      {/* Visual */}
      {step.visual && (
        <div className="ml-12">
          {step.visual.type === "formula" ? (
            <div className="rounded-2xl bg-foreground p-5 text-center">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-foreground/40">
                {step.visual.title || "Formule"}
              </p>
              <p className="font-mono text-2xl font-semibold text-primary-foreground">{step.visual.content}</p>
            </div>
          ) : step.visual.type === "diagram" ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{step.visual.title || "Schema"}</p>
              <pre className="overflow-auto rounded-xl bg-muted p-4 font-mono text-sm leading-6">{step.visual.content}</pre>
            </div>
          ) : (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <p className="mb-2 text-xs font-semibold text-accent">{step.visual.title || "Exercice"}</p>
              <p className="text-sm">{step.visual.content}</p>
            </div>
          )}
        </div>
      )}

      {/* Interaction area */}
      {step.state !== "EXPLAIN" && step.state !== "RECAP" && (
        <div className="ml-12">
          {step.interaction.type === "choice" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {step.interaction.choices?.map((choice) => (
                <button
                  key={choice.id}
                  disabled={pending}
                  onClick={() => submit(choice.id)}
                  className="rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {step.interaction.type === "voice_or_text" && (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" disabled>
                    <Mic className="h-4 w-4" />
                    Mode vocal bientot
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type={step.interaction.type === "number" ? "number" : "text"}
                  value={textAnswer}
                  disabled={pending}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={step.interaction.placeholder || "Ta reponse..."}
                  onKeyDown={(e) => { if (e.key === "Enter" && canSubmitResponse) submit(undefined, textAnswer); }}
                  className="flex-1"
                />
                <Button
                  disabled={pending || !canSubmitResponse}
                  onClick={() => submit(undefined, textAnswer)}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Support/help buttons */}
      {step.state !== "INTRO" && step.state !== "RECAP" && (
        <div className="ml-12">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Besoin d'aide ?
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(step.state === "EXPLAIN"
              ? [
                  { id: "not_understood", label: "Pas compris" },
                  { id: "understood_continue", label: "Compris !" },
                  { id: "need_example", label: "Un exemple" },
                  { id: "ask_question", label: "Question" },
                ]
              : step.state === "CHECK"
              ? [
                  { id: "not_understood", label: "Pas compris" },
                  { id: "need_example", label: "Un exemple" },
                  { id: "ask_question", label: "Question" },
                ]
              : [
                  { id: "need_hint", label: "Indice" },
                  { id: "need_example", label: "Exemple" },
                  { id: "not_understood", label: "Pas compris" },
                  { id: "ask_question", label: "Question" },
                ]
            ).map((btn) => (
              <button
                key={btn.id}
                disabled={pending}
                onClick={() => {
                  if (btn.id === "ask_question") { setShowQuestionBox((p) => !p); return; }
                  submit(btn.id);
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {showQuestionBox && (
            <div className="mt-2 flex gap-2">
              <Input
                value={questionText}
                disabled={pending}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ecris ta question..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && questionText.trim().length >= 3) {
                    submit("ask_question", questionText.trim());
                    setQuestionText("");
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                disabled={pending || questionText.trim().length < 3}
                onClick={() => { submit("ask_question", questionText.trim()); setQuestionText(""); }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recap / Complete */}
      {step.state === "RECAP" && (
        <div className="ml-12 rounded-2xl border-2 border-accent/30 bg-accent/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <span className="font-display font-semibold text-accent">Session terminee !</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Valide pour debloquer la prochaine micro-session.
          </p>
          <div className="flex gap-2">
            <Button onClick={completeAndReturn} disabled={pending} variant="success" size="lg" className="flex-1">
              <CheckCircle2 className="h-4 w-4" />
              Terminer
            </Button>
            <Button onClick={() => submit("restart")} disabled={pending} variant="outline" size="lg">
              Encore 1 exo
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="ml-12 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
