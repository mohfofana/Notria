"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const MESSAGES: Record<string, string[]> = {
  "/": [
    "Salut, je suis Prof Ada. Commence par creer ton compte BEPC en 2 minutes.",
    "Tu peux tester une session de chat a tout moment.",
  ],
  "/dashboard": [
    "Bienvenue. Voici ton plan BEPC de la semaine.",
    "Objectif du jour: une session de cours + un exercice corrige.",
  ],
  "/chat": [
    "Pose ta question en francais simple, je t'aide pas a pas.",
    "Bloque sur un exercice ? utilise aussi Notria Vision.",
  ],
  "/notria-vision": [
    "Prends une photo nette de l'exercice pour une meilleure correction.",
    "Je vais te guider et te laisser essayer avant de donner la solution complete.",
  ],
  "/examens": [
    "Lance un BEPC blanc pour t'entrainer en conditions reelles.",
    "Apres chaque test, on ajuste ton plan de revision.",
  ],
  "/onboarding": [
    "On configure ton profil BEPC, puis je te propose un planning adapte.",
  ],
};

function getMessagesForPath(pathname: string): string[] {
  const match = Object.keys(MESSAGES).find((path) => pathname.startsWith(path));
  return match ? MESSAGES[match] : ["Je suis la si tu as besoin d'aide."];
}

export function ProfAdaGuide() {
  const pathname = usePathname();
  const messages = useMemo(() => getMessagesForPath(pathname), [pathname]);
  const [open, setOpen] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMessageIndex(0);
    setDismissed(false);
    setOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
      setOpen(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [dismissed, messages.length]);

  if (pathname.startsWith("/connexion") || pathname.startsWith("/inscription")) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-xs flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {!dismissed && open && (
        <div className="pointer-events-auto animate-fade-slide-up rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-primary">Prof Ada</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fermer la bulle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-foreground">{messages[messageIndex]}</p>
        </div>
      )}

      <div className="pointer-events-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (dismissed) {
              setDismissed(false);
              setOpen(true);
              return;
            }
            setOpen((prev) => !prev);
          }}
          className="rounded-full bg-white/90"
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          {dismissed ? "Parler a Ada" : open ? "Reduire" : "Parler"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setDismissed(false);
            setOpen(true);
          }}
          className="relative overflow-hidden rounded-full border-2 border-white bg-white shadow-md ring-2 ring-primary/20"
          aria-label="Ouvrir l'assistant Prof Ada"
        >
          <Image
            src="/illustrations/prof_ada.png"
            alt="Avatar Prof Ada"
            width={96}
            height={96}
            quality={100}
            sizes="64px"
            className="h-16 w-16 object-cover object-top"
          />
        </button>

        {!dismissed && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Masquer
          </button>
        )}
      </div>
    </div>
  );
}
