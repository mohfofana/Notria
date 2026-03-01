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
  const [linkCode, setLinkCode] = useState("");
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

  function handlePhoneChange(value: string) {
    setPhone(formatPhone(value));
  }

  function getFullPhone() {
    return `+225 ${phone}`;
  }

  function normalizeLinkCode(value: string) {
    return value.replace(/\s/g, "").toUpperCase().slice(0, 8);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const phoneDigits = phone.replace(/\s/g, "");
    if (phoneDigits.length !== 10) {
      setError("Numéro de téléphone invalide (10 chiffres requis)");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (linkCode && normalizeLinkCode(linkCode).length !== 8) {
      setError("Le code de liaison doit contenir 8 caractères");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(getFullPhone(), password, linkCode ? normalizeLinkCode(linkCode) : undefined);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg === "Invalid credentials") {
        setError("Numéro ou mot de passe incorrect");
      } else if (!err?.response) {
        setError("Impossible de joindre le serveur. Vérifie que l'API tourne sur le port 3001.");
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
        <h1 className="text-3xl font-bold tracking-tight">Content de te revoir</h1>
        <p className="text-base text-muted-foreground">
          Connecte-toi pour reprendre tes revisions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base">Numero de telephone</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +225
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="07 08 09 10 11"
              className="rounded-l-none"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base">Mot de passe</Label>
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

        <div className="space-y-2">
          <Label htmlFor="linkCode" className="text-base">Code de liaison (optionnel)</Label>
          <Input
            id="linkCode"
            placeholder="AB12CD34"
            value={linkCode}
            onChange={(e) => setLinkCode(normalizeLinkCode(e.target.value))}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <p className="text-base text-destructive font-medium">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <p className="text-center text-base text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-primary font-medium hover:underline">
          Inscris-toi
        </Link>
      </p>
    </>
  );
}
