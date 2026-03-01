"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function ConnexionPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    const phoneDigits = phone.replace(/\s/g, "");
    if (phoneDigits.length !== 10) { setError("Numero invalide (10 chiffres)"); return; }
    if (password.length < 6) { setError("Mot de passe: 6 caracteres minimum"); return; }

    setIsSubmitting(true);
    try {
      await login(`+225 ${phone}`, password);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      setError(msg === "Invalid credentials" ? "Numero ou mot de passe incorrect" : msg || "Une erreur est survenue.");
    } finally { setIsSubmitting(false); }
  }

  return (
    <>
      <div className="space-y-2 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Content de te revoir !</h1>
        <p className="text-sm text-muted-foreground">
          Connecte-toi pour reprendre tes revisions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up delay-1">
        <div className="space-y-2">
          <Label htmlFor="phone">Numero de telephone</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border-2 border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
              +225
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="07 08 09 10 11"
              className="rounded-l-none"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
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
              placeholder="Ton mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <><Loader2 className="h-4 w-4 animate-spin" /> Connexion...</>
          ) : "Se connecter"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground animate-fade-in delay-2">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-primary font-semibold hover:underline">
          Inscris-toi
        </Link>
      </p>
    </>
  );
}
