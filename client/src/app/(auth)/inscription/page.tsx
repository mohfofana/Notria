"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function InscriptionPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", password: "",
    role: "student" as "student" | "parent",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const local = digits.startsWith("225") ? digits.slice(3) : digits;
    const trimmed = local.slice(0, 10);
    const parts = trimmed.match(/.{1,2}/g);
    return parts ? parts.join(" ") : "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const phoneDigits = form.phone.replace(/\s/g, "");
    if (phoneDigits.length !== 10) { setError("Numero invalide (10 chiffres)"); return; }
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("Nom et prenom obligatoires"); return; }
    if (form.password.length < 6) { setError("Mot de passe: 6 caracteres minimum"); return; }

    setIsSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: `+225 ${form.phone}`,
        password: form.password,
        role: form.role,
      });
      router.push(form.role === "student" ? "/onboarding/step-1" : "/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      setError(msg === "Phone already in use" ? "Ce numero est deja utilise" : msg || "Une erreur est survenue.");
    } finally { setIsSubmitting(false); }
  }

  return (
    <>
      <div className="space-y-2 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Cree ton compte</h1>
        <p className="text-sm text-muted-foreground">
          Commence tes revisions en quelques minutes
        </p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up delay-1">
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, role: "student" }))}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
            form.role === "student"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30"
          }`}
        >
          <GraduationCap className="h-6 w-6" />
          <span className="text-sm font-semibold">Je suis eleve</span>
        </button>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, role: "parent" }))}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
            form.role === "parent"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30"
          }`}
        >
          <Users className="h-6 w-6" />
          <span className="text-sm font-semibold">Je suis parent</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up delay-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prenom</Label>
            <Input
              id="firstName" placeholder="Fatou"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName" placeholder="Kone"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numero de telephone</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border-2 border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
              +225
            </span>
            <Input
              id="phone" type="tel" placeholder="07 08 09 10 11"
              className="rounded-l-none"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="6 caracteres minimum"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Inscription...</>
          ) : "Creer mon compte"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground animate-fade-in delay-3">
        Tu as deja un compte ?{" "}
        <Link href="/connexion" className="text-primary font-semibold hover:underline">
          Connecte-toi
        </Link>
      </p>
    </>
  );
}
