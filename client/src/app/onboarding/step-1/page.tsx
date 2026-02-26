"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

export default function OnboardingStep1() {
  const { refreshMe } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    school: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    setIsSubmitting(true);
    try {
      await api.post("/students/onboarding/step-1", {
        examType: "BEPC",
        grade: "3eme",
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
        <h1 className="text-2xl font-bold">Profil eleve BEPC</h1>
        <p className="text-muted-foreground mt-1">
          Nous preparons actuellement les eleves de 3eme (BEPC).
        </p>
      </div>

      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
        <p className="text-sm font-semibold text-primary">Examen cible: BEPC</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Niveau configure: classe de 3eme.
        </p>
      </div>

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
