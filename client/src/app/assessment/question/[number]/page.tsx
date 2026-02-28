"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

interface Question {
  id: string;
  topic: string;
  difficulty: "facile" | "moyen" | "difficile";
  question: string;
  options: string[];
}

interface AssessmentResponse {
  success: boolean;
  data: {
    completed: boolean;
    currentQuestionIndex: number;
    totalQuestions: number;
    question?: Question;
    previousAnswer?: {
      isCorrect: boolean;
      explanation?: string;
    };
  };
  error?: string;
}

function formatDifficulty(difficulty: string): string {
  if (!difficulty) return "";
  return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
}

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

  useEffect(() => {
    loadQuestion();
  }, [questionNumber]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<AssessmentResponse>("/assessment/question");
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load question");
      }

      const { data } = response.data;
      if (data.completed) {
        router.push("/assessment/results");
        return;
      }

      setTotalQuestions(data.totalQuestions || 15);
      setQuestion(data.question || null);
      setSelectedAnswer(null);
      setCanGoNext(false);

      if (data.previousAnswer) {
        setFeedback(data.previousAnswer);
        setShowFeedback(true);
      } else {
        setFeedback(null);
        setShowFeedback(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (canGoNext) {
      router.push(`/assessment/question/${questionNumber + 1}`);
      return;
    }

    if (selectedAnswer === null || !question) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<AssessmentResponse>("/assessment/answer", {
        questionId: question.id,
        answer: selectedAnswer,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to submit answer");
      }

      const { data } = response.data;
      if (data.completed) {
        router.push("/assessment/results");
        return;
      }

      setTotalQuestions(data.totalQuestions || totalQuestions);

      if (data.previousAnswer) {
        setFeedback(data.previousAnswer);
        setShowFeedback(true);
      } else {
        setFeedback(null);
        setShowFeedback(false);
      }

      setCanGoNext(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={() => router.push("/assessment/start")} className="mt-4 w-full">
              Recommencer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Aucune question disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Question {questionNumber} sur {totalQuestions}
          </span>
          <span>
            {question.topic} - {formatDifficulty(question.difficulty)}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              disabled={isSubmitting || canGoNext}
              className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                selectedAnswer === index
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          ))}
        </CardContent>
      </Card>

      {showFeedback && feedback && (
        <Card className={`border-2 ${feedback.isCorrect ? "border-green-500" : "border-red-500"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {feedback.isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">{feedback.isCorrect ? "Bonne reponse !" : "Reponse incorrecte"}</span>
            </div>
            {feedback.explanation && (
              <p className="text-sm text-muted-foreground mt-2">{feedback.explanation}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSubmitAnswer}
        disabled={(!canGoNext && selectedAnswer === null) || isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validation...
          </>
        ) : canGoNext ? (
          "Question suivante"
        ) : (
          "Valider la reponse"
        )}
      </Button>
    </div>
  );
}
