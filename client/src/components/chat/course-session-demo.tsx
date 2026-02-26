"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { BookOpen, ChevronLeft, ChevronRight, Download, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SessionStep = {
  title: string;
  content: string[];
};

interface CourseSessionDemoProps {
  subject: string;
  topic?: string;
  unlocked: boolean;
  onUnlock: () => void;
}

function buildSession(subject: string, topic?: string): SessionStep[] {
  const chapter = topic || `Introduction a ${subject}`;
  return [
    {
      title: "Cours",
      content: [
        `Chapitre: ${chapter}`,
        "Objectif: comprendre l'idee principale en termes simples.",
        "Methode: definition, exemple concret, puis mini-application.",
      ],
    },
    {
      title: "Verification rapide",
      content: [
        "Question 1: peux-tu redire la regle avec tes mots ?",
        "Question 2: dans quel cas on applique cette methode ?",
        "Si besoin, Prof Ada reformule autrement.",
      ],
    },
    {
      title: "Exercices guides",
      content: [
        "Exercice 1: niveau facile pour prendre confiance.",
        "Exercice 2: niveau moyen pour appliquer la methode.",
        "Exercice 3: format BEPC avec temps limite.",
      ],
    },
    {
      title: "Correction et recap",
      content: [
        "Ce qui est bien fait.",
        "Erreur principale a corriger.",
        "Plan de revision pour demain (10-15 min).",
      ],
    },
  ];
}

function downloadSessionPdf(subject: string, topic: string, steps: SessionStep[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  doc.setFillColor(15, 118, 110);
  doc.roundedRect(margin, 10, pageWidth - margin * 2, 18, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NOTRIA", margin + 4, 22);
  doc.setFontSize(10);
  doc.text("Resume de seance BEPC", pageWidth - margin - 48, 22);

  y = 36;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Matiere: ${subject}`, margin, y);
  y += 7;
  doc.text(`Theme: ${topic}`, margin, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  steps.forEach((step, index) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${step.title}`, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    step.content.forEach((line) => {
      const wrapped = doc.splitTextToSize(`- ${line}`, pageWidth - margin * 2);
      doc.text(wrapped, margin + 2, y);
      y += wrapped.length * 5 + 1;
    });
    y += 2;
  });

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Notria - Prof Ada", margin, 286);
  doc.save(`notria-resume-${subject.toLowerCase().replace(/\\s+/g, "-")}.pdf`);
}

export function CourseSessionDemo({ subject, topic, unlocked, onUnlock }: CourseSessionDemoProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => buildSession(subject, topic), [subject, topic]);
  const current = steps[stepIndex];
  const finalTopic = topic || `Cours de ${subject}`;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Presentation du cours
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {subject} • {finalTopic}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici comment la seance se passe. Avance et recule avec les boutons.
          </p>
        </div>

        <article className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="font-semibold">
                Etape {stepIndex + 1}/{steps.length}: {current.title}
              </p>
              <p className="text-xs text-muted-foreground">Cours BEPC avec Prof Ada</p>
            </div>
          </div>

          <div className="space-y-2">
            {current.content.map((line) => (
              <p key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{line}</span>
              </p>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Precedent
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))}
              disabled={stepIndex === steps.length - 1}
            >
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadSessionPdf(subject, finalTopic, steps)}
            >
              <Download className="mr-1 h-4 w-4" />
              Telecharger le resume PDF
            </Button>
          </div>
        </article>

        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Prochaine action
          </p>
          <p className="text-sm text-muted-foreground">
            {unlocked
              ? "Le cours est debloque. Tu peux maintenant poser tes questions dans le chat."
              : "Clique sur le bouton ci-dessous pour passer aux questions de l'eleve."}
          </p>
          <Button onClick={onUnlock} disabled={unlocked} className="mt-3">
            {unlocked ? "Cours debloque" : "J'ai compris le cours, je pose mes questions"}
          </Button>
        </div>
      </div>
    </div>
  );
}
