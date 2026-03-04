"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Compass,
  CheckCircle2,
  Eraser,
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
  figure?: "triangle" | "vector" | "repere" | "fraction" | "equation" | "method";
  labels?: Record<string, string>;
  steps?: string[];
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

interface ParsedBoardContent {
  title?: string;
  lines: string[];
}

type IllustrationKind = "vector" | "triangle" | "equation" | "repere" | "fraction" | "method";

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }
  return output;
}

function parseBoardContent(raw?: string): ParsedBoardContent {
  if (!raw) return { lines: [] };
  const trimmed = raw.trim();

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        title?: string;
        steps?: Array<{ content?: string; latex?: string; text?: string }>;
      };
      const lines = dedupeLines(
        (parsed.steps ?? [])
          .flatMap((step) => [step.content, step.latex, step.text])
          .filter((line): line is string => Boolean(line)),
      ).slice(0, 8);
      if (lines.length > 0) {
        return { title: parsed.title, lines };
      }
    } catch {
      // Fall back to plain line parsing.
    }
  }

  return {
    lines: dedupeLines(
      trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ).slice(0, 8),
  };
}

function inferIllustrationKind(step: GuidedStep, contentLines: string[]): IllustrationKind {
  if (step.visual?.figure === "vector") return "vector";
  if (step.visual?.figure === "triangle") return "triangle";
  if (step.visual?.figure === "repere") return "repere";
  if (step.visual?.figure === "fraction") return "fraction";
  if (step.visual?.figure === "equation") return "equation";
  if (step.visual?.figure === "method") return "method";

  const text = [
    step.prompt,
    ...step.coachLines,
    step.visual?.title ?? "",
    step.visual?.content ?? "",
    ...contentLines,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("vecteur") || text.includes("coordonne") || text.includes("norme")) return "vector";
  if (text.includes("triangle") || text.includes("pythagore") || text.includes("hypotenuse")) return "triangle";
  if (text.includes("fraction") || text.includes("ratio") || text.includes("proportion")) return "fraction";
  if (text.includes("fonction") || text.includes("repere") || text.includes("courbe") || text.includes("graph")) return "repere";
  if (text.includes("equation") || /[0-9]\s*[xX]/.test(text) || text.includes("resous")) return "equation";
  return "method";
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

export default function SessionTodayPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-sm text-muted-foreground">Chargement...</p></div>}>
      <SessionTodayPage />
    </Suspense>
  );
}

function SessionTodayPage() {
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
  const [showBoard, setShowBoard] = useState(false);
  const [showIllustration, setShowIllustration] = useState(false);
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

  useEffect(() => {
    const sidFromQuery = searchParams.get("sid");
    const sidFromStorage = typeof window !== "undefined" ? window.localStorage.getItem("notria.guidedSessionId") : null;
    const sid = sidFromQuery || sidFromStorage;
    if (!sid) return;

    async function resumeSession() {
      try {
        const { data } = await api.get(`/guided-sessions/${sid}`);
        setSessionId(sid);
        setStep(data.step);
        setProgress(data.progress);
      } catch {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("notria.guidedSessionId");
        }
      }
    }

    resumeSession();
  }, [searchParams]);

  useEffect(() => {
    setShowIllustration(false);
  }, [step?.id]);

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
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notria.guidedSessionId", data.sessionId);
      }
      router.replace(`/session/today?sid=${data.sessionId}`);
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
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("notria.guidedSessionId");
      }
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Impossible de finaliser la session.");
      setPending(false);
    }
  }

  function renderVisual() {
    if (!step) return null;
    return <AiChalkBoard step={step} showIllustration={showIllustration} />;
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
              className="h-auto min-h-12 justify-start whitespace-normal border border-slate-300 bg-white px-4 py-3 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
            <Button variant="secondary" type="button" disabled className="bg-slate-100 text-slate-700">
              <Mic className="mr-2 h-4 w-4" />
              Repondre vocalement
            </Button>
            <Badge variant="outline" className="border-slate-300 text-slate-600">Mode vocal bientot</Badge>
          </div>
        )}

        <div className="rounded-xl border border-slate-300 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Ta reponse</p>
          <Input
            type={inputType}
            value={textAnswer}
            disabled={pending}
            onChange={(event) => setTextAnswer(event.target.value)}
            placeholder={step.interaction.placeholder || "Entre ta reponse"}
            className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-400"
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
      <div className="rounded-xl border border-slate-300 bg-white p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Aides rapides
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setShowIllustration((prev) => !prev)}
          >
            <Compass className="mr-1 h-4 w-4" />
            {showIllustration ? "Masquer illustration" : "Illustration contextuelle"}
          </Button>
          <Button
            type="button"
            variant={showBoard ? "default" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() => setShowBoard((prev) => !prev)}
            className={showBoard ? "" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"}
          >
            <PencilLine className="mr-1 h-4 w-4" />
            {showBoard ? "Fermer le tableau" : "Ouvrir le tableau"}
          </Button>
          {supportButtons.map((btn) => (
            <Button
              key={btn.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
              className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-400"
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
              <Button type="button" size="sm" variant="secondary" disabled className="bg-slate-100 text-slate-700">
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
      <div className="min-h-screen bg-white">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-[1240px] space-y-4 p-4 sm:p-6">
        <div className="soft-shell rounded-2xl border border-border/70 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Salle de classe - Prof Ada</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Ecran {currentScreen}/6</Badge>
            <Badge variant="outline">{STEP_LABELS[step.state]}</Badge>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground sm:text-sm">
          <span>Score: {progress?.correctAnswers ?? 0}/{progress?.totalChecks ?? 0}</span>
          <span>Progression: {progress?.completionPercent ?? 0}%</span>
          <span>Termine toute la seance pour debloquer la suivante.</span>
        </div>
        {isFinalExercise && (
          <div className="mt-2 inline-flex w-fit items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Exo final obligatoire de ce topic
          </div>
        )}
        </div>

        <section className="soft-shell rounded-2xl border border-border/70 p-3 sm:p-4">
          <ClassroomBoardFrame>
            {renderVisual()}

            <div className="mt-4 space-y-4 rounded-xl border border-slate-300 bg-white p-3 sm:p-4">
              {renderInteraction()}
              {renderSupportActions()}

              {step.state === "RECAP" && (
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Session terminee</p>
                  <p className="mb-3 text-sm text-slate-700">
                    Termine pour valider cette micro-session dans ton programme.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={completeAndReturnToDashboard} disabled={pending}>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Terminer
                    </Button>
                    <Button onClick={() => submit("restart")} disabled={pending}>
                      Encore 1 exercice
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </ClassroomBoardFrame>
        </section>

        {showBoard && (
          <section className="soft-shell rounded-2xl border border-border/70 p-3 sm:p-4">
            <ClassroomBoardFrame>
              <QuickDrawBoard />
            </ClassroomBoardFrame>
          </section>
        )}
      </div>
    </div>
  );
}

function ClassroomBoardFrame({ children }: { children: React.ReactNode }) {
  const screws = [
    "left-3 top-3",
    "right-3 top-3",
    "left-3 bottom-3",
    "right-3 bottom-3",
  ];

  return (
    <div className="relative rounded-[1.25rem] border border-[#aeb5c0] bg-[#e7ebf1] p-3 shadow-[0_24px_42px_-22px_rgba(13,18,26,0.28)]">
      {screws.map((position) => (
        <span
          key={position}
          className={`absolute ${position} h-3 w-3 rounded-full border border-[#bfc4cc] bg-gradient-to-br from-[#f3f5f7] to-[#cbd1d9] shadow-sm`}
        />
      ))}
      <div className="relative min-h-[560px] overflow-hidden rounded-[0.82rem] border border-[#d9dee6] bg-white p-4 shadow-[inset_0_0_18px_rgba(0,0,0,0.04)] sm:p-5">
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}

function QuickDrawBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState("#f2f1e8");
  const [tool, setTool] = useState<"draw" | "erase">("draw");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.scale(ratio, ratio);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = color;
  }, [color]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    if (tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 16;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = color;
    }
    const { x, y } = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDraw() {
    drawingRef.current = false;
  }

  function clearBoard() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">Ton tableau</p>
      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white p-0 shadow-[inset_0_0_14px_rgba(71,85,105,0.06)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
          <Badge variant="outline" className="border-slate-300 text-slate-700">Outils</Badge>
          <Button
            type="button"
            variant={tool === "draw" && color === "#f2f1e8" ? "default" : "outline"}
            size="sm"
            className={tool === "draw" && color !== "#f2f1e8" ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900" : ""}
            onClick={() => {
              setTool("draw");
              setColor("#f2f1e8");
            }}
          >
            Craie blanche
          </Button>
          <Button
            type="button"
            variant={tool === "draw" && color === "#ef4444" ? "default" : "outline"}
            size="sm"
            className={tool === "draw" && color !== "#ef4444" ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900" : ""}
            onClick={() => {
              setTool("draw");
              setColor("#ef4444");
            }}
          >
            Craie rouge
          </Button>
          <Button
            type="button"
            variant={tool === "draw" && color === "#22c55e" ? "default" : "outline"}
            size="sm"
            className={tool === "draw" && color !== "#22c55e" ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900" : ""}
            onClick={() => {
              setTool("draw");
              setColor("#22c55e");
            }}
          >
            Craie verte
          </Button>
          <Button
            type="button"
            variant={tool === "erase" ? "default" : "outline"}
            size="sm"
            className={tool !== "erase" ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900" : ""}
            onClick={() => setTool("erase")}
          >
            <Eraser className="mr-1 h-4 w-4" />
            Gomme
          </Button>
          <Button type="button" variant="secondary" size="sm" className="bg-slate-200 text-slate-800 hover:bg-slate-300" onClick={clearBoard}>
            Effacer
          </Button>
        </div>
        <canvas
          ref={canvasRef}
          className="block h-72 w-full touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
          aria-label="Tableau de dessin"
        />
      </div>
      <p className="text-xs text-slate-500">
        Pose tes calculs ici pendant que Prof Ada explique sur le tableau principal.
      </p>
    </div>
  );
}

function AiChalkBoard({
  step,
  showIllustration,
}: {
  step: GuidedStep;
  showIllustration: boolean;
}) {
  const parsedVisual = parseBoardContent(step.visual?.content);
  const contentLines = parsedVisual.lines;
  const boardTitle = parsedVisual.title || step.visual?.title || "Tableau Prof Ada";
  const illustrationKind = inferIllustrationKind(step, contentLines);
  const coachBoardLines = [...step.coachLines.slice(0, 3), step.prompt]
    .map((line) => line.trim())
    .filter(Boolean);
  const visibleCoachLines = dedupeLines(coachBoardLines).slice(0, 4);
  const [animatedStepCount, setAnimatedStepCount] = useState(0);

  useEffect(() => {
    const total = step.visual?.steps?.length ?? 0;
    setAnimatedStepCount(0);
    if (total === 0) return;

    const timer = window.setInterval(() => {
      setAnimatedStepCount((prev) => {
        if (prev >= total) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [step.id, step.visual?.steps?.length]);

  return (
    <div className="relative h-full overflow-hidden rounded-[0.65rem] border border-slate-200 bg-transparent p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
        {boardTitle}
      </p>

      {step.feedback && (
        <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Prof Ada
          </p>
          <p className="text-sm leading-relaxed text-indigo-950">{step.feedback}</p>
        </div>
      )}

      {contentLines.length === 0 && !step.visual && (
        <div className="mt-1 space-y-2">
          {visibleCoachLines.length > 0 ? (
            visibleCoachLines.map((line, index) => (
              <p
                key={`coach-board-${step.id}-${index}`}
                className={`text-[1.08rem] leading-relaxed ${index === visibleCoachLines.length - 1 ? "font-semibold text-slate-900" : "text-slate-700"}`}
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-lg font-medium text-slate-700">
              Lis bien l'explication de Prof Ada, puis utilise les boutons en bas.
            </p>
          )}
        </div>
      )}

      {step.visual?.type === "formula" && contentLines.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3 space-y-1">
          {contentLines.map((line, index) => (
            <p
              key={`formula-${step.id}-${index}`}
              className={`chalk-line text-[1.14rem] font-medium leading-relaxed ${index % 2 === 0 ? "text-slate-900" : "text-slate-700"}`}
              style={{ animationDelay: `${0.7 + index * 0.25}s` }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {step.visual?.steps && step.visual.steps.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Etapes</p>
          <div className="space-y-1">
            {step.visual.steps.slice(0, animatedStepCount).map((line, index) => (
              <p key={`${step.id}-s-${index}`} className="text-sm text-slate-800 chalk-line" style={{ animationDelay: `${index * 0.15}s` }}>
                {index + 1}. {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {step.visual?.type === "diagram" && (
        <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2">
          <ContextualIllustration kind={illustrationKind} />
        </div>
      )}

      {step.visual?.type === "exercise_card" && step.visual.content && (
        <p className="mt-3 whitespace-pre-wrap text-[1.08rem] font-medium leading-relaxed text-slate-900">
          Exercice: {step.visual.content}
        </p>
      )}

      {showIllustration && (
        <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2">
          <ContextualIllustration kind={illustrationKind} />
        </div>
      )}
    </div>
  );
}

function ContextualIllustration({ kind }: { kind: IllustrationKind }) {
  if (kind === "vector") {
    return (
      <svg viewBox="0 0 320 180" className="chalk-geometry" role="img" aria-label="Schema vecteur AB">
        <circle cx="60" cy="130" r="3" fill="#000000" />
        <circle cx="250" cy="60" r="3" fill="#000000" />
        <line x1="60" y1="130" x2="250" y2="60" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 3 }} />
        <polygon points="250,60 238,62 244,72" fill="#000000" />
        <text x="48" y="146" fill="#1f2937" fontSize="12">A(1,2)</text>
        <text x="256" y="58" fill="#1f2937" fontSize="12">B(5,4)</text>
        <text x="142" y="88" fill="#1f2937" fontSize="12">AB = (4,2)</text>
      </svg>
    );
  }
  if (kind === "triangle") {
    return (
      <svg viewBox="0 0 320 180" className="chalk-geometry" role="img" aria-label="Schema triangle rectangle">
        <line x1="40" y1="145" x2="210" y2="145" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 3 }} />
        <line x1="40" y1="145" x2="40" y2="55" className="chalk-draw chalk-draw-2" stroke="#000000" style={{ strokeWidth: 3 }} />
        <line x1="40" y1="55" x2="210" y2="145" className="chalk-draw chalk-draw-3" stroke="#000000" style={{ strokeWidth: 3 }} />
        <text x="30" y="50" fill="#1f2937" fontSize="12">A</text>
        <text x="28" y="160" fill="#1f2937" fontSize="12">B</text>
        <text x="214" y="160" fill="#1f2937" fontSize="12">C</text>
      </svg>
    );
  }
  if (kind === "equation") {
    return (
      <svg viewBox="0 0 320 180" className="chalk-geometry" role="img" aria-label="Etapes resolution equation">
        <text x="34" y="48" fill="#111827" fontSize="16">2x + 5 = 17</text>
        <text x="34" y="86" fill="#111827" fontSize="16">2x = 12</text>
        <text x="34" y="124" fill="#111827" fontSize="16">x = 6</text>
        <line x1="26" y1="56" x2="290" y2="56" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 2.5 }} />
      </svg>
    );
  }
  if (kind === "repere") {
    return (
      <svg viewBox="0 0 320 180" className="chalk-geometry" role="img" aria-label="Schema repere cartesien">
        <line x1="30" y1="145" x2="290" y2="145" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 3 }} />
        <line x1="160" y1="20" x2="160" y2="165" className="chalk-draw chalk-draw-2" stroke="#000000" style={{ strokeWidth: 3 }} />
        <polyline points="60,140 110,110 160,95 220,70 270,45" className="chalk-draw chalk-draw-3" stroke="#000000" style={{ strokeWidth: 3 }} />
        <text x="293" y="148" fill="#1f2937" fontSize="12">x</text>
        <text x="165" y="22" fill="#1f2937" fontSize="12">y</text>
      </svg>
    );
  }
  if (kind === "fraction") {
    return (
      <svg viewBox="0 0 320 180" className="chalk-geometry" role="img" aria-label="Schema fractions">
        <rect x="40" y="48" width="95" height="84" rx="6" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 3 }} />
        <line x1="40" y1="90" x2="135" y2="90" className="chalk-draw chalk-draw-2" stroke="#000000" style={{ strokeWidth: 3 }} />
        <rect x="185" y="48" width="95" height="84" rx="6" className="chalk-draw chalk-draw-3" stroke="#000000" style={{ strokeWidth: 3 }} />
        <line x1="232" y1="48" x2="232" y2="132" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 3 }} />
        <text x="75" y="160" fill="#1f2937" fontSize="12">1/2</text>
        <text x="218" y="160" fill="#1f2937" fontSize="12">1/4</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 320 180" className="chalk-geometry" role="img" aria-label="Methode en etapes">
      <text x="30" y="48" fill="#111827" fontSize="15">1. Lire l'enonce</text>
      <text x="30" y="85" fill="#111827" fontSize="15">2. Choisir la formule</text>
      <text x="30" y="122" fill="#111827" fontSize="15">3. Calculer puis verifier</text>
      <line x1="26" y1="56" x2="292" y2="56" className="chalk-draw" stroke="#000000" style={{ strokeWidth: 2.5 }} />
    </svg>
  );
}
