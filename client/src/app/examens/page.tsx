import { BookOpenCheck, Clock3, FileCheck2, PenSquare } from "lucide-react";
import { MvpTopbar } from "@/components/mvp/mvp-topbar";
import { Button } from "@/components/ui/button";

const exams = [
  { title: "BEPC Blanc - Mathématiques", duration: "2h", progress: "Non démarré" },
  { title: "BEPC Blanc - Français", duration: "2h", progress: "En cours" },
  { title: "BEPC Blanc - Histoire/Géo", duration: "1h30", progress: "Terminé" },
];

const corrections = [
  "Score global avec barème officiel",
  "Analyse par compétence (raisonnement, méthode, rigueur)",
  "Erreurs fréquentes + recommandations personnalisées",
];

export default function ExamensPage() {
  return (
    <main className="min-h-screen">
      <MvpTopbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 rounded-3xl border border-border bg-white/90 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">F013 · F014</p>
          <h1 className="mt-2 text-3xl font-semibold">BEPC Blanc complet</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Lance des examens blancs en conditions réelles et reçois une correction
            détaillée alimentée par l'IA, alignée sur le programme officiel.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button>
              <PenSquare className="mr-2 h-4 w-4" />
              Démarrer un sujet
            </Button>
            <Button variant="outline">Voir mes résultats</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-white/90 p-6">
            <h2 className="mb-4 text-lg font-semibold">Sujets disponibles</h2>
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.title}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Durée: {exam.duration}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {exam.progress}
                  </span>
                </div>
              ))}
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
                Recommandation automatique
              </p>
              <p className="mt-2">
                Après chaque blanc, Notria propose un plan de révision ciblé pour
                la semaine suivante.
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
