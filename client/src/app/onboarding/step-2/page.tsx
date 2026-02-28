"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

export default function OnboardingStep2() {
  const { student, refreshMe } = useAuth();
  const router = useRouter();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    setIsSubmitting(true);
    try {
      await api.post("/students/onboarding/step-2", {
        prioritySubjects: ["Mathématiques"],
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
        <h1 className="text-2xl font-bold">Matière prioritaire</h1>
        <p className="text-muted-foreground mt-1">
          Pour cette phase MVP, Notria se concentre sur les mathématiques.
        </p>
      </div>

      <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15">
            <Sigma className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-primary">Mathématiques</p>
            <p className="text-sm text-muted-foreground">
              Programme BEPC 3eme - progression guidee pas a pas.
            </p>
          </div>
          <Check className="h-5 w-5 text-primary" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
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
