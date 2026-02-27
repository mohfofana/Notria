"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, BookOpen, Clock, Send, Home } from "lucide-react";
import { api } from "@/lib/api";

interface Exercise {
  id: number;
  question: string;
  difficulty: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  score?: number;
}

export default function HomeworkToday() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadTodaysHomework();
  }, []);

  const loadTodaysHomework = async () => {
    try {
      const response = await api.get("/sessions/homework/today");
      setExercises(response.data.homework || []);
    } catch (error) {
      console.error("Failed to load today's homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    if (!answer.trim()) return;

    // Simulate answer checking (in real implementation, this would be sent to backend)
    const isCorrect = Math.random() > 0.3; // 70% chance of correct for demo
    const score = isCorrect ? 100 : Math.floor(Math.random() * 60); // 0-60 if wrong

    const newResults = [...results];
    newResults[currentExercise] = {
      answer: answer.trim(),
      isCorrect,
      score,
    };
    setResults(newResults);

    setSubmitted(true);

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentExercise < exercises.length - 1) {
        setCurrentExercise(currentExercise + 1);
        setAnswer("");
        setSubmitted(false);
      } else {
        // All exercises completed
        showFinalResults(newResults);
      }
    }, 2000);
  };

  const showFinalResults = (finalResults: any[]) => {
    const correct = finalResults.filter(r => r.isCorrect).length;
    const averageScore = Math.round(finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length);

    // In real implementation, send results to backend
    console.log("Homework completed:", { correct, total: exercises.length, averageScore });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des devoirs...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pas de devoirs aujourd'hui</h2>
            <p className="text-muted-foreground mb-6">
              Bravo ! Tu as terminé tous tes devoirs pour aujourd'hui.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              <Home className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">📝 DEVOIRS - DÉRIVÉES</h1>
        <p className="text-muted-foreground">
          {exercises.length} exercices (15 min)
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Question {currentExercise + 1} sur {exercises.length}</span>
            <Badge variant="outline" className="text-xs">
              {exercise.difficulty}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{exercise.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Écris ta réponse ici..."
            disabled={submitted}
            className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          {/* Feedback */}
          {submitted && results[currentExercise] && (
            <div className={`mt-4 p-4 rounded-lg ${
              results[currentExercise].isCorrect
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className={`h-5 w-5 ${
                  results[currentExercise].isCorrect ? "text-green-600" : "text-red-600"
                }`} />
                <span className={`font-semibold ${
                  results[currentExercise].isCorrect ? "text-green-800" : "text-red-800"
                }`}>
                  {results[currentExercise].isCorrect ? "Bonne réponse !" : "Réponse incorrecte"}
                </span>
              </div>

              {!results[currentExercise].isCorrect && (
                <p className="text-sm text-gray-700">
                  Ta réponse : {results[currentExercise].answer}
                </p>
              )}

              <p className="text-sm font-medium mt-2">
                Score : {results[currentExercise].score}/100
              </p>
            </div>
          )}

          {!submitted && (
            <Button
              onClick={submitAnswer}
              disabled={!answer.trim()}
              className="w-full mt-4"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Valider la réponse
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Final Results */}
      {currentExercise >= exercises.length - 1 && submitted && results.length === exercises.length && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              ✅ DEVOIRS TERMINÉS !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold">
                Score : {Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)}%
              </div>

              <p className="text-muted-foreground">
                Super ! Tu as bien compris les concepts de dérivées.
                Petite erreur sur l'exercice 3 : tu as oublié de multiplier par 3.
                On reverra ça demain !
              </p>

              <Button onClick={() => router.push("/dashboard")} size="lg" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
