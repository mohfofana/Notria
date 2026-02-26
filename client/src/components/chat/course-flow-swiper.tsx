"use client";

import { BookOpen, CheckCircle2, CircleHelp, ClipboardCheck, ScrollText } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  points: string[];
  icon: ComponentType<{ className?: string }>;
};

interface CourseFlowSwiperProps {
  subject: string;
  topic?: string;
  unlocked: boolean;
  onUnlock: () => void;
}

function buildSlides(subject: string, topic?: string): Slide[] {
  const chapter = topic || `les bases de ${subject}`;

  return [
    {
      id: "cours",
      title: "1. Cours express",
      subtitle: `Comprendre ${chapter}`,
      points: [
        "Definition simple + exemple concret du quotidien.",
        "Methode en 3 etapes pour resoudre un exercice.",
        "Mini-fiche memo en fin de slide.",
      ],
      icon: BookOpen,
    },
    {
      id: "verif",
      title: "2. Verification",
      subtitle: "On verifie ta comprehension",
      points: [
        "2 questions rapides (sans pression).",
        "Si erreur: nouvelle explication avec un autre angle.",
        "Objectif: valider la methode avant les exercices.",
      ],
      icon: CircleHelp,
    },
    {
      id: "exo",
      title: "3. Exercices progressifs",
      subtitle: "Facile → Moyen → BEPC",
      points: [
        "Exercice 1: application directe.",
        "Exercice 2: raisonnement guide.",
        "Exercice 3: format BEPC chronometre.",
      ],
      icon: ScrollText,
    },
    {
      id: "corr",
      title: "4. Correction intelligente",
      subtitle: "Retour detaille sur ta copie",
      points: [
        "Ce qui est juste et pourquoi.",
        "Erreur precise + comment l'eviter.",
        "Conseil de revision pour la prochaine seance.",
      ],
      icon: ClipboardCheck,
    },
  ];
}

export function CourseFlowSwiper({
  subject,
  topic,
  unlocked,
  onUnlock,
}: CourseFlowSwiperProps) {
  const slides = buildSlides(subject, topic);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Deroule de la seance
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          {subject} {topic ? `• ${topic}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Swipe les cartes pour voir comment le cours se passe. On commence
          toujours par le cours avant les questions.
        </p>
      </div>

      <div className="flex-1 overflow-x-auto pb-3">
        <div className="flex h-full min-h-[290px] gap-3 snap-x snap-mandatory">
          {slides.map((slide) => (
            <article
              key={slide.id}
              className="snap-start shrink-0 w-[88%] sm:w-[58%] lg:w-[46%] rounded-2xl border border-border bg-white p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
                  <slide.icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{slide.title}</p>
                  <p className="text-xs text-muted-foreground">{slide.subtitle}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {slide.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={onUnlock} disabled={unlocked} className="w-full sm:w-auto">
          {unlocked
            ? "Cours valide, tu peux poser tes questions"
            : "J'ai lu le cours, je passe aux questions"}
        </Button>
      </div>
    </div>
  );
}
