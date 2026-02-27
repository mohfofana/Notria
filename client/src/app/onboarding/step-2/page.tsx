"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getSubjectsForStudent } from "@notria/shared";

export default function OnboardingStep2() {
  const { student, refreshMe } = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available subjects based on student profile
  const subjects = student
    ? getSubjectsForStudent(
        "BEPC",
        undefined
      )
    : [];

  function toggleSubject(subject: string) {
    setSelected((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selected.length === 0) {
      setError("Sélectionne au moins une matière");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/students/onboarding/step-2", {
        prioritySubjects: selected,
      });
      await refreshMe();
      router.push("/onboarding/step-3");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!student) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tes matières</h1>
        <p className="text-muted-foreground mt-1">
          Prof Ada se concentrera sur ces matières en priorité.
          D'autres matières seront bientôt disponibles !
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {subjects.map((subject) => {
          const isSelected = selected.includes(subject);
          return (
            <button
              key={subject}
              type="button"
              onClick={() => toggleSubject(subject)}
              disabled={isSubmitting}
              className={`relative rounded-xl border-2 p-4 text-left text-sm font-medium transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              {subject}
              {isSelected && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selected.length} matière{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}
        </p>
      )}

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || selected.length === 0}>
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
