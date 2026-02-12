"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

const SERIES = ["C", "D", "A1", "A2"] as const;

export default function OnboardingStep1() {
  const { refreshMe } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    examType: "" as "" | "BEPC" | "BAC",
    series: "" as string,
    school: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.examType) {
      setError("Choisis ton examen");
      return;
    }
    if (form.examType === "BAC" && !form.series) {
      setError("Choisis ta série");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/students/onboarding/step-1", {
        examType: form.examType,
        grade: form.examType === "BEPC" ? "3eme" : "terminale",
        series: form.examType === "BAC" ? form.series : undefined,
        school: form.school || undefined,
      });
      await refreshMe();
      router.push("/onboarding/step-2");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Quel examen tu prepares ?</h1>
        <p className="text-muted-foreground mt-1">On va adapter ton programme en fonction</p>
      </div>

      {/* Exam type selector */}
      <div className="grid grid-cols-2 gap-4">
        {(["BEPC", "BAC"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setForm((p) => ({ ...p, examType: type, series: "" }))}
            className={`rounded-xl border-2 p-6 text-center transition-colors ${
              form.examType === type
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className={`text-2xl font-bold ${form.examType === type ? "text-primary" : "text-foreground"}`}>
              {type}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {type === "BEPC" ? "Classe de 3ème" : "Classe de Terminale"}
            </div>
          </button>
        ))}
      </div>

      {/* Series selector (BAC only) */}
      {form.examType === "BAC" && (
        <div className="space-y-3">
          <Label>Quelle série ?</Label>
          <div className="grid grid-cols-4 gap-3">
            {SERIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((p) => ({ ...p, series: s }))}
                className={`rounded-lg border-2 p-3 text-center text-sm font-semibold transition-colors ${
                  form.series === s
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* School (optional) */}
      <div className="space-y-2">
        <Label htmlFor="school">Ton établissement (optionnel)</Label>
        <Input
          id="school"
          placeholder="Ex: Lycée Classique d'Abidjan"
          value={form.school}
          onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
          disabled={isSubmitting}
        />
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !form.examType}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Suivant"
        )}
      </Button>
    </form>
  );
}
