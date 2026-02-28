"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Loader2, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";

export default function AssessmentStart() {
  const { user, student, hasSchedule, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (!isLoading && isAuthenticated && user?.role === "student") {
      const next = getNextOnboardingPath({ student, hasSchedule });
      if (next !== "/assessment/start") {
        router.replace(next);
      }
    }
  }, [isLoading, isAuthenticated, user, student, hasSchedule, router]);

  const handleStartAssessment = async () => {
    setIsStarting(true);
    try {
      await api.post("/assessment/start");
      router.push("/assessment/question/1");
    } catch (error) {
      console.error("Failed to start assessment:", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Test de Niveau BEPC Maths</h1>
        <p className="text-muted-foreground mt-2">
          Un test fiable pour construire ton plan personnalise
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Comment ca fonctionne ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">15 questions de Mathematiques</h3>
              <p className="text-sm text-muted-foreground">
                Le test couvre les domaines BEPC 3eme et ajuste la difficulte sur les domaines piliers
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Programme officiel CI</h3>
              <p className="text-sm text-muted-foreground">
                Questions 100% alignees BEPC 3eme Maths (Pythagore, Thales, equations, fonctions, etc.)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">10-15 minutes</h3>
              <p className="text-sm text-muted-foreground">
                Une evaluation rapide pour identifier tes forces et tes lacunes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pret a commencer ?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Reponds honnetement sans aide exterieure. L'objectif est de mesurer ton niveau reel pour adapter ton parcours.
          </p>

          <Button onClick={handleStartAssessment} size="lg" className="w-full" disabled={isStarting}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Demarrage du test...
              </>
            ) : (
              "Commencer le test"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
