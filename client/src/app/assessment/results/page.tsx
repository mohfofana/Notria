"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Play, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface SubjectLevel {
  level: string;
  percentage: number;
}

interface AssessmentResultsData {
  subjectLevels: Record<string, SubjectLevel>;
  overallAverage: number;
}

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { student, refreshMe } = useAuth();
  const [results, setResults] = useState<AssessmentResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const { data } = await api.get("/assessment/results");
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "débutant":
        return "text-red-600";
      case "intermédiaire":
        return "text-yellow-600";
      case "avancé":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case "débutant":
        return "Débutant";
      case "intermédiaire":
        return "Intermédiaire";
      case "avancé":
        return "Avancé";
      default:
        return level;
    }
  };

  const getLevelBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleContinue = async () => {
    await refreshMe();
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Calcul de tes résultats...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Impossible de charger les résultats</p>
            <Button onClick={() => router.push("/assessment/start")}>
              Refaire le test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreOn20 = Math.round((results.overallAverage / 100) * 20 * 10) / 10;
  const targetScore = student?.targetScore ?? 14;
  const gap = Math.max(0, targetScore - scoreOn20);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Tes Résultats</h1>
        <p className="text-muted-foreground mt-2">
          Voici ton niveau actuel par matière
        </p>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Ton niveau détecté
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {scoreOn20}/20
            </div>
            <Progress value={results.overallAverage} className="w-full h-3" />
            <p className="text-muted-foreground">
              Score global : {results.overallAverage}%
            </p>
            {gap > 0 && (
              <p className="text-muted-foreground">
                Objectif : {targetScore}/20 (écart à combler : +{gap.toFixed(1)} points)
              </p>
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                C'est faisable ! Ton programme personnalisé va t'y amener.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par matière</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(results.subjectLevels).map(([subject, data]) => (
            <div key={subject} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{subject}</span>
                <span className={`text-sm font-semibold ${getLevelColor(data.level)}`}>
                  {getLevelLabel(data.level)} ({data.percentage}%)
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all ${getLevelBarColor(data.percentage)}`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-semibold">Ce que ça veut dire</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {Object.entries(results.subjectLevels)
              .filter(([, d]) => d.percentage < 60)
              .map(([subject]) => (
                <li key={subject}>
                  <span className="text-red-600 font-medium">{subject}</span> : on va reprendre les bases ensemble, pas de panique !
                </li>
              ))}
            {Object.entries(results.subjectLevels)
              .filter(([, d]) => d.percentage >= 60 && d.percentage < 80)
              .map(([subject]) => (
                <li key={subject}>
                  <span className="text-yellow-600 font-medium">{subject}</span> : bonne base, on va approfondir.
                </li>
              ))}
            {Object.entries(results.subjectLevels)
              .filter(([, d]) => d.percentage >= 80)
              .map(([subject]) => (
                <li key={subject}>
                  <span className="text-green-600 font-medium">{subject}</span> : excellent niveau, on maintient !
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button onClick={handleContinue} size="lg" className="w-full">
        <Play className="mr-2 h-4 w-4" />
        Voir mon programme
      </Button>
    </div>
  );
}
