"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Loader2, Target, TrendingUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";

export default function AssessmentStart() {
  const { user, student, hasSchedule, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.replace("/connexion"); return; }
    if (!isLoading && isAuthenticated && user?.role === "student") {
      const next = getNextOnboardingPath({ student, hasSchedule });
      if (next !== "/assessment/start") router.replace(next);
    }
  }, [isLoading, isAuthenticated, user, student, hasSchedule, router]);

  async function handleStart() {
    setIsStarting(true);
    try { await api.post("/assessment/start"); router.push("/assessment/question/1"); }
    catch { setIsStarting(false); }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <Target className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Test de niveau Maths</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Un test rapide pour construire ton programme personnalise
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {[
          { icon: BookOpen, title: "15 questions", desc: "Couvre tous les domaines BEPC 3eme" },
          { icon: TrendingUp, title: "Programme officiel CI", desc: "Pythagore, Thales, equations, fonctions..." },
          { icon: Clock, title: "10-15 minutes", desc: "Evaluation rapide de tes forces et lacunes" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/8">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground mb-4">
          Reponds honnetement sans aide. L'objectif est de mesurer ton niveau reel pour adapter ton parcours.
        </p>
        <Button onClick={handleStart} size="xl" className="w-full" disabled={isStarting}>
          {isStarting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Demarrage...</>
          ) : (
            <><Play className="h-4 w-4" /> Commencer le test</>
          )}
        </Button>
      </div>
    </div>
  );
}
