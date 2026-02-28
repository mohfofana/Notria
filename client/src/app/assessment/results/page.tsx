"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

interface DomainLevel {
  level: string;
  percentage: number;
}

interface AssessmentResultsData {
  subjectLevels: Record<string, DomainLevel>;
  overallAverage: number;
}

function getLevelColor(level: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes("debutant") || normalized.includes("dÃ©butant")) return "text-red-600";
  if (normalized.includes("intermediaire") || normalized.includes("intermÃ©diaire")) return "text-yellow-600";
  if (normalized.includes("avance") || normalized.includes("avancÃ©")) return "text-green-600";
  return "text-gray-600";
}

function getLevelLabel(level: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes("debutant") || normalized.includes("dÃ©butant")) return "Debutant";
  if (normalized.includes("intermediaire") || normalized.includes("intermÃ©diaire")) return "Intermediaire";
  if (normalized.includes("avance") || normalized.includes("avancÃ©")) return "Avance";
  return level;
}

function getLevelBarColor(percentage: number) {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 60) return "bg-yellow-500";
  return "bg-red-500";
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

  const handleContinue = async () => {
    await refreshMe();
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Calcul de tes resultats...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Impossible de charger les resultats</p>
            <Button onClick={() => router.push("/assessment/start")}>Refaire le test</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreOn20 = Math.round((results.overallAverage / 100) * 20 * 10) / 10;
  const targetScore = student?.targetScore ?? 14;
  const gap = Math.max(0, targetScore - scoreOn20);
  const domains = Object.entries(results.subjectLevels).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Tes resultats</h1>
        <p className="text-muted-foreground mt-2">Voici ton niveau actuel par domaine de mathematiques</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Niveau global detecte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">{scoreOn20}/20</div>
            <Progress value={results.overallAverage} className="w-full h-3" />
            <p className="text-muted-foreground">Score global : {results.overallAverage}%</p>
            {gap > 0 && (
              <p className="text-muted-foreground">
                Objectif : {targetScore}/20 (ecart a combler : +{gap.toFixed(1)} points)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultats par domaine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {domains.map(([domain, data]) => (
            <div key={domain} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{domain}</span>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-semibold">Ce que ca veut dire</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {domains
              .filter(([, domain]) => domain.percentage < 60)
              .map(([domain]) => (
                <li key={domain}>
                  <span className="text-red-600 font-medium">{domain}</span> : on reprend les bases.
                </li>
              ))}
            {domains
              .filter(([, domain]) => domain.percentage >= 60 && domain.percentage < 80)
              .map(([domain]) => (
                <li key={domain}>
                  <span className="text-yellow-600 font-medium">{domain}</span> : bonne base, on approfondit.
                </li>
              ))}
            {domains
              .filter(([, domain]) => domain.percentage >= 80)
              .map(([domain]) => (
                <li key={domain}>
                  <span className="text-green-600 font-medium">{domain}</span> : tres bon niveau.
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      <Button onClick={handleContinue} size="lg" className="w-full">
        <Play className="mr-2 h-4 w-4" />
        Voir mon programme
      </Button>
    </div>
  );
}
