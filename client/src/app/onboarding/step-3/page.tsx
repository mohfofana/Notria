"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

const SCORE_OPTIONS = [8, 10, 12, 14, 16, 18, 20];

const TIME_OPTIONS = [
  { value: "15min", label: "15 min", description: "Révision rapide" },
  { value: "30min", label: "30 min", description: "Session standard" },
  { value: "1h", label: "1 heure", description: "Étude approfondie" },
];

export default function OnboardingStep3() {
  const { refreshMe } = useAuth();
  const router = useRouter();

  const [targetScore, setTargetScore] = useState<number | null>(null);
  const [dailyTime, setDailyTime] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!targetScore) {
      setError("Choisis une note cible");
      return;
    }
    if (!dailyTime) {
      setError("Choisis un temps d'étude quotidien");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/students/onboarding/step-3", {
        targetScore,
        dailyTime,
      });
      await refreshMe();
      router.push("/assessment/start");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tes objectifs</h1>
        <p className="text-muted-foreground mt-1">
          Prof Ada adaptera ton programme en fonction de tes ambitions
        </p>
      </div>

      {/* Target Score */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Quelle note vises-tu à l'examen ?</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCORE_OPTIONS.map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setTargetScore(score)}
              disabled={isSubmitting}
              className={`rounded-xl border-2 px-5 py-3 text-sm font-semibold transition-colors ${
                targetScore === score
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              {score}/20
            </button>
          ))}
        </div>
      </div>

      {/* Daily Time */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Combien de temps par jour ?</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDailyTime(option.value)}
              disabled={isSubmitting}
              className={`rounded-xl border-2 p-4 text-center transition-colors ${
                dailyTime === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="text-lg font-bold">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || !targetScore || !dailyTime}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération du programme...
          </>
        ) : (
          "Générer mon programme"
        )}
      </Button>
    </form>
  );
}
