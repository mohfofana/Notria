"use client";

import {
  BellRing,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Shield,
  Star,
  TriangleAlert,
} from "lucide-react";
import { MvpTopbar } from "@/components/mvp/mvp-topbar";
import { Button } from "@/components/ui/button";
import { downloadParentReportExamplePdf } from "@/lib/report-pdf";

const weeklyStats = [
  { label: "Temps d'étude", value: "6h 10m", trend: "+18%" },
  { label: "Sessions terminées", value: "9", trend: "+3" },
  { label: "Exercices validés", value: "34", trend: "+11" },
  { label: "Score moyen BEPC", value: "73%", trend: "+6 pts" },
];

const subjectProgress = [
  { subject: "Mathématiques", progress: 78, focus: "Fractions, proportionnalité" },
  { subject: "Français", progress: 69, focus: "Accords et rédaction" },
  { subject: "Physique-Chimie", progress: 62, focus: "Circuits électriques" },
  { subject: "Histoire-Géo", progress: 74, focus: "Repères chronologiques" },
];

const weekTimeline = [
  { day: "Lundi", course: "Mathématiques - Fractions", status: "Terminé" },
  { day: "Mardi", course: "Français - Expression écrite", status: "Terminé" },
  { day: "Mercredi", course: "Physique - Circuit en série", status: "En cours" },
  { day: "Jeudi", course: "Histoire - Indépendance", status: "Prévu" },
  { day: "Vendredi", course: "BEPC Blanc (mini-test)", status: "Prévu" },
];

const alerts = [
  {
    level: "attention",
    title: "Baisse de régularité en Physique",
    detail: "2 réponses incorrectes consécutives sur les circuits.",
  },
  {
    level: "ok",
    title: "Objectif hebdo presque atteint",
    detail: "Encore 1 session pour atteindre l'objectif de la semaine.",
  },
  {
    level: "info",
    title: "Rapport hebdomadaire prêt dimanche",
    detail: "Synthèse complète envoyée à 20h.",
  },
];

const recentSessions = [
  { date: "Mar 18:00", subject: "Mathématiques", outcome: "Bonne progression", score: "16/20" },
  { date: "Mer 17:30", subject: "Français", outcome: "À renforcer", score: "12/20" },
  { date: "Jeu 18:10", subject: "Physique", outcome: "Difficulté repérée", score: "10/20" },
];

export default function ParentPage() {
  return (
    <main className="min-h-screen">
      <MvpTopbar />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 grid gap-6 lg:grid-cols-5">
          <article className="rounded-3xl border border-border bg-white/90 p-6 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Espace Parent • F015</p>
            <h1 className="mt-2 text-3xl font-semibold">Suivi complet de votre enfant</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Visualisez la progression réelle, les difficultés et les actions à faire cette semaine,
              avec des recommandations claires de Prof Ada.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button>
                <MessageSquareText className="mr-2 h-4 w-4" />
                Ouvrir le rapport IA
              </Button>
              <Button variant="outline" onClick={downloadParentReportExamplePdf}>
                Télécharger exemple PDF
              </Button>
              <Button variant="outline">
                <BellRing className="mr-2 h-4 w-4" />
                Gérer les alertes
              </Button>
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/90 p-6 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Star className="h-5 w-5 text-primary" />
              Actions parent cette semaine
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">1. Vérifier la séance du jeudi</p>
                <p className="mt-1 text-muted-foreground">
                  Confirmer que l'élève commence à 18h et termine la séance.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">2. Contrôler le mini BEPC blanc</p>
                <p className="mt-1 text-muted-foreground">
                  Objectif minimum: 12/20 en fin de semaine.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">3. Faire un point de 10 minutes dimanche</p>
                <p className="mt-1 text-muted-foreground">
                  Questions simples: ce qui est compris, ce qui bloque, plan de la semaine suivante.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Statut parent
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                2 actions sur 3 validées cette semaine.
              </p>
            </div>
          </article>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {weeklyStats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-border bg-white/90 p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-xs text-green-700">{stat.trend}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <article className="rounded-3xl border border-border bg-white/90 p-6 lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold">Progression par matière</h2>
            <div className="space-y-4">
              {subjectProgress.map((item) => (
                <div key={item.subject} className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-sm text-muted-foreground">{item.progress}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Focus: {item.focus}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/90 p-6 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="h-5 w-5 text-primary" />
              Semaine en cours
            </h2>
            <div className="space-y-3">
              {weekTimeline.map((entry) => (
                <div key={entry.day} className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">{entry.day}</p>
                  <p className="mt-1 text-sm font-medium">{entry.course}</p>
                  <p className="mt-1 text-xs text-primary">{entry.status}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <article className="rounded-3xl border border-border bg-white/90 p-6 lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold">Séances récentes</h2>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={`${session.date}-${session.subject}`} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{session.subject}</p>
                    <p className="text-xs text-muted-foreground">{session.date}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{session.outcome}</p>
                  <p className="mt-1 text-xs text-primary">Score: {session.score}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/90 p-6 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ChartNoAxesCombined className="h-5 w-5 text-primary" />
              Rapport IA synthétique
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">Point fort</p>
                <p className="mt-1 text-muted-foreground">
                  Bonne progression en mathématiques, meilleure rigueur dans les étapes de calcul.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">Point à renforcer</p>
                <p className="mt-1 text-muted-foreground">
                  Travailler les exercices de physique avec schémas (2 sessions ciblées conseillées).
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">Action parent recommandée</p>
                <p className="mt-1 text-muted-foreground">
                  Vérifier le créneau de révision du jeudi et encourager la session BEPC blanc de vendredi.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-white/90 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <TriangleAlert className="h-5 w-5 text-primary" />
              Centre d'alertes
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.title} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/90 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              Transparence et confiance
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  Historique complet des séances, questions et corrections.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                  Vue des horaires réels de révision (ponctualité et assiduité).
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  Recommandations concrètes à appliquer côté parent.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
