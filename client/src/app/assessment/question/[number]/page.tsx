"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

interface Question { id: string; topic: string; difficulty: "facile" | "moyen" | "difficile"; question: string; options: string[]; }
interface AssessmentResponse {
  success: boolean;
  data: { completed: boolean; currentQuestionIndex: number; totalQuestions: number; question?: Question; previousAnswer?: { isCorrect: boolean; explanation?: string }; };
  error?: string;
}

const diffColor: Record<string, string> = { facile: "text-accent", moyen: "text-warning-foreground", difficile: "text-destructive" };

export default function AssessmentQuestion() {
  const router = useRouter();
  const params = useParams();
  const questionNumber = parseInt(params.number as string, 10);

  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [canGoNext, setCanGoNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadQuestion(); }, [questionNumber]);

  async function loadQuestion() {
    try {
      setLoading(true); setError(null);
      const { data: res } = await api.get<AssessmentResponse>("/assessment/question");
      if (!res.success) throw new Error(res.error);
      if (res.data.completed) { router.push("/assessment/results"); return; }
      setTotalQuestions(res.data.totalQuestions || 15);
      setQuestion(res.data.question || null);
      setSelectedAnswer(null); setCanGoNext(false);
      if (res.data.previousAnswer) { setFeedback(res.data.previousAnswer); setShowFeedback(true); }
      else { setFeedback(null); setShowFeedback(false); }
    } catch (e: any) { setError(e.message || "Erreur de chargement"); }
    finally { setLoading(false); }
  }

  async function handleSubmit() {
    if (canGoNext) { router.push(`/assessment/question/${questionNumber + 1}`); return; }
    if (selectedAnswer === null || !question) return;
    setIsSubmitting(true);
    try {
      const { data: res } = await api.post<AssessmentResponse>("/assessment/answer", { questionId: question.id, answer: selectedAnswer });
      if (!res.success) throw new Error(res.error);
      if (res.data.completed) { router.push("/assessment/results"); return; }
      setTotalQuestions(res.data.totalQuestions || totalQuestions);
      if (res.data.previousAnswer) { setFeedback(res.data.previousAnswer); setShowFeedback(true); }
      else { setFeedback(null); setShowFeedback(false); }
      setCanGoNext(true);
    } catch (e: any) { setError(e.message || "Erreur"); }
    finally { setIsSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-destructive mb-4">{error || "Aucune question"}</p>
        <Button onClick={() => router.push("/assessment/start")}>Recommencer</Button>
      </div>
    );
  }

  const pct = (questionNumber / totalQuestions) * 100;

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {questionNumber}/{totalQuestions}</span>
          <span className={diffColor[question.difficulty] || ""}>{question.topic}</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-display text-base font-semibold leading-relaxed">{question.question}</p>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelectedAnswer(i)}
            disabled={isSubmitting || canGoNext}
            className={`w-full rounded-xl border-2 p-4 text-left text-sm transition-all active:scale-[0.98] ${
              selectedAnswer === i
                ? "border-primary bg-primary/5 font-medium"
                : "border-border bg-card hover:border-primary/30"
            } disabled:opacity-60`}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-xs font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {showFeedback && feedback && (
        <div className={`rounded-2xl border-2 p-4 animate-scale-in ${
          feedback.isCorrect ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {feedback.isCorrect ? <CheckCircle className="h-5 w-5 text-accent" /> : <XCircle className="h-5 w-5 text-destructive" />}
            <span className="font-semibold text-sm">{feedback.isCorrect ? "Bonne reponse !" : "Pas tout a fait..."}</span>
          </div>
          {feedback.explanation && <p className="text-xs text-muted-foreground mt-1">{feedback.explanation}</p>}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={(!canGoNext && selectedAnswer === null) || isSubmitting} size="lg" className="w-full">
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Validation...</>
        ) : canGoNext ? (
          <><ArrowRight className="h-4 w-4" /> Question suivante</>
        ) : "Valider"}
      </Button>
    </div>
  );
}
