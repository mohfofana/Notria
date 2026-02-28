"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

const SCORE_OPTIONS = [8, 10, 12, 14, 16, 18, 20];

export default function OnboardingStep3() {
  const { refreshMe } = useAuth();
  const router = useRouter();

  const [targetScore, setTargetScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!targetScore) {
      setError("Choisis une note cible");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/students/onboarding/step-3", {
        targetScore,
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
        <h1 className="text-2xl font-bold">Ton objectif</h1>
        <p className="text-muted-foreground mt-1">
          Prof Ada adaptera ton programme en fonction de tes ambitions
        </p>
      </div>

      {/* Target Score */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Quelle note vises-tu au BEPC ?</h2>
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

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || !targetScore}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Suivant"
        )}
      </Button>
    </form>
  );
}
