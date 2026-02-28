"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Clock3, FileCheck2, PenSquare } from "lucide-react";

import { MvpTopbar } from "@/components/mvp/mvp-topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

interface ExamOverviewResponse {
  success: boolean;
  data: {
    examType: "BEPC" | "BAC";
    grade: string;
    targetScore: number | null;
    currentWeek: number | null;
    totalWeeks: number | null;
    exams: Array<{
      subject: string;
      title: string;
      durationMinutes: number;
      progress: "Non démarré" | "Terminé" | string;
      lastScore: number | null;
      lastDate: string | null;
    }>;
    lastAssessment: {
      score: number | null;
      level: string | null;
      completedAt: string;
    } | null;
  };
}

const corrections = [
  "Score global avec barème officiel",
  "Analyse par compétence (raisonnement, méthode, rigueur)",
  "Erreurs fréquentes + recommandations personnalisées",
];

export default function ExamensPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<ExamOverviewResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (user?.role !== "student") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || user?.role !== "student") return;

    async function loadOverview() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ExamOverviewResponse>("/assessment/overview");
        setOverview(data.data);
      } catch {
        setError("Impossible de charger la section examens.");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [isLoading, isAuthenticated, user]);

  const completedCount = useMemo(
    () => (overview?.exams ?? []).filter((exam) => exam.progress === "Terminé").length,
    [overview]
  );

  if (isLoading || loading) {
    return (
      <main className="min-h-screen">
        <MvpTopbar />
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-sm text-muted-foreground">Chargement des examens...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <MvpTopbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 rounded-3xl border border-border bg-white/90 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">F013 · F014</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {overview?.examType ?? "BEPC"} Blanc - dynamique
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Épreuves générées selon ton profil ({overview?.grade ?? "-"}) et tes matières
            actives, avec correction IA détaillée.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => router.push("/assessment/start")}>
              <PenSquare className="mr-2 h-4 w-4" />
              Démarrer un sujet
            </Button>
            <Button variant="outline" onClick={() => router.push("/assessment/results")}>
              Voir mes résultats
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-white/90 p-6">
            <h2 className="mb-4 text-lg font-semibold">Sujets disponibles</h2>
            <div className="space-y-3">
              {(overview?.exams ?? []).map((exam) => (
                <div
                  key={exam.title}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Durée: {Math.floor(exam.durationMinutes / 60)}h{exam.durationMinutes % 60 === 0 ? "" : ` ${exam.durationMinutes % 60}m`}
                    </p>
                    {exam.lastScore !== null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dernier score: {exam.lastScore}/100
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {exam.progress}
                  </span>
                </div>
              ))}
              {(overview?.exams ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun sujet disponible pour le moment.</p>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/90 p-6">
            <h2 className="mb-4 text-lg font-semibold">Correction détaillée</h2>
            <div className="grid gap-3">
              {corrections.map((item) => (
                <div key={item} className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="flex items-start gap-2 text-sm">
                    <FileCheck2 className="mt-0.5 h-4 w-4 text-primary" />
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <BookOpenCheck className="h-4 w-4 text-primary" />
                Suivi automatique
              </p>
              <p className="mt-2">
                {completedCount}/{overview?.exams.length ?? 0} sujets terminés.
                {overview?.lastAssessment?.score !== null && overview?.lastAssessment?.score !== undefined
                  ? ` Dernière moyenne: ${overview.lastAssessment.score}%`
                  : " Commence un test pour générer ton premier bilan."}
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
