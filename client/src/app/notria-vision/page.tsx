import { Camera, CheckCircle2, ImageIcon } from "lucide-react";
import { MvpTopbar } from "@/components/mvp/mvp-topbar";
import { Button } from "@/components/ui/button";

const steps = [
  "Prends une photo nette de ton exercice",
  "Notria lit l'exercice et explique la methode",
  "Tu vois la correction et ou tu t'es trompe",
];

export default function NotriaVisionPage() {
  return (
    <main className="min-h-screen">
      <MvpTopbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <article className="rounded-3xl border border-border bg-white/90 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Notria Vision</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Corriger un devoir en photo</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Une page simple: tu prends une photo, puis Notria t'explique la correction pas a pas.
            </p>

            <div className="mt-6 space-y-3">
              {steps.map((step) => (
                <p key={step} className="inline-flex items-start gap-2 text-base text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {step}
                </p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="h-12 px-5 text-base">
                <Camera className="mr-2 h-5 w-5" />
                Prendre une photo
              </Button>
              <Button variant="outline" className="h-12 px-5 text-base">
                <ImageIcon className="mr-2 h-5 w-5" />
                Importer une image
              </Button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
