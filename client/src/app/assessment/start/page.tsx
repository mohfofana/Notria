"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Clock, TrendingUp, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { getNextOnboardingPath } from "@/lib/onboarding";

export default function AssessmentStart() {
  const { user, student, hasSchedule, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  // Check if user needs to complete onboarding first
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
      // Handle error - maybe show toast
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Test de Niveau Adaptatif</h1>
        <p className="text-muted-foreground mt-2">
          Découvrons ton niveau actuel pour créer ton plan personnalisé
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Comment ça fonctionne ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">10 questions adaptatives</h3>
              <p className="text-sm text-muted-foreground">
                La difficulté s'ajuste selon tes réponses pour une évaluation précise
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Par matière</h3>
              <p className="text-sm text-muted-foreground">
                Questions en Maths, SVT et autres matières selon ton profil
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">8-12 minutes</h3>
              <p className="text-sm text-muted-foreground">
                Un test rapide pour identifier tes forces et axes d'amélioration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prêt à commencer ?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Réponds honnêtement sans chercher sur internet. L'objectif est d'évaluer
            ton niveau réel pour adapter ton programme d'étude.
          </p>

          <Button onClick={handleStartAssessment} size="lg" className="w-full" disabled={isStarting}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Démarrage du test...
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
