"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, Clock, Loader2, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";

export default function AssessmentStart() {
  const { user, student, hasSchedule, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [overview, setOverview] = useState<{
    totalQuestions: number;
    estimatedMinutes: number;
    activeSubjects: string[];
    availableForAssessment: string[];
    missingBanks: string[];
  } | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "student") return;
    async function loadOverview() {
      try {
        const { data } = await api.get("/assessment/overview");
        if (data?.success) {
          setOverview({
            totalQuestions: data.data?.totalQuestions ?? 15,
            estimatedMinutes: data.data?.estimatedMinutes ?? 15,
            activeSubjects: data.data?.activeSubjects ?? [],
            availableForAssessment: data.data?.availableForAssessment ?? [],
            missingBanks: data.data?.missingBanks ?? [],
          });
        }
      } catch {
        setOverview(null);
      }
    }
    loadOverview();
  }, [isAuthenticated, user]);

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
        <h1 className="text-3xl font-bold">Test de Niveau 3eme</h1>
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
              <h3 className="font-semibold">
                {overview?.totalQuestions ?? 15} questions adaptees a ton profil
              </h3>
              <p className="text-sm text-muted-foreground">
                Le test suit tes matieres prioritaires et ajuste la difficulte selon tes reponses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Programme officiel CI</h3>
              <p className="text-sm text-muted-foreground">
                Matières actives: {(overview?.activeSubjects?.length ? overview.activeSubjects : ["Mathématiques"]).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">{overview?.estimatedMinutes ?? 15} minutes</h3>
              <p className="text-sm text-muted-foreground">
                Une evaluation rapide pour identifier tes forces et tes lacunes
              </p>
            </div>
          </div>
          {overview?.missingBanks?.length ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>
                Banque de questions en preparation pour: {overview.missingBanks.join(", ")}.
                Le test utilisera les matieres deja disponibles.
              </p>
            </div>
          ) : null}
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
