"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function InscriptionPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    role: "student" as "student" | "parent",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function formatPhone(raw: string) {
    // Keep only digits
    const digits = raw.replace(/\D/g, "");
    // Remove leading 225 if the user typed it (we add the prefix ourselves)
    const local = digits.startsWith("225") ? digits.slice(3) : digits;
    // Format as XX XX XX XX (8 digits max for Ivory Coast)
    const trimmed = local.slice(0, 8);
    const parts = trimmed.match(/.{1,2}/g);
    return parts ? parts.join(" ") : "";
  }

  function handlePhoneChange(value: string) {
    setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
  }

  function getFullPhone() {
    return `+225 ${form.phone}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fullPhone = getFullPhone();
    // Basic validation
    const phoneDigits = form.phone.replace(/\s/g, "");
    if (phoneDigits.length !== 8) {
      setError("Numéro de téléphone invalide (8 chiffres requis)");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Nom et prénom sont obligatoires");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: fullPhone,
        password: form.password,
        role: form.role,
      });
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg === "Phone already in use") {
        setError("Ce numéro de téléphone est déjà utilisé");
      } else {
        setError(msg || "Une erreur est survenue. Réessaie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Crée ton compte</h1>
        <p className="text-muted-foreground">
          Commence à étudier avec Prof Ada gratuitement
        </p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, role: "student" }))}
          className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
            form.role === "student"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          Je suis élève
        </button>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, role: "parent" }))}
          className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
            form.role === "parent"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          Je suis parent
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              placeholder="Fatou"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              placeholder="Koné"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +225
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="07 08 09 10"
              className="rounded-l-none"
              value={form.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
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
              placeholder="6 caractères minimum"
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
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inscription...
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Tu as déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary font-medium hover:underline">
          Connecte-toi
        </Link>
      </p>
    </>
  );
}
