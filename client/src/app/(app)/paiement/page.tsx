import { Check, CreditCard, ShieldCheck, Ticket } from "lucide-react";
import { MvpTopbar } from "@/components/mvp/mvp-topbar";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratuit",
    price: "0 FCFA",
    perks: ["Sessions limitées", "Chat texte", "Onboarding complet"],
  },
  {
    name: "Standard",
    price: "2 000 FCFA/mois",
    perks: ["Sessions illimitées", "Notria Vision", "BEPC Blanc mensuel"],
  },
  {
    name: "Premium",
    price: "3 500 FCFA/mois",
    perks: ["Chat vocal avancé", "Dashboard parent complet", "Support prioritaire"],
  },
];

export default function PaiementPage() {
  return (
    <main className="min-h-screen">
      <MvpTopbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 rounded-3xl border border-border bg-white/90 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">F026</p>
          <h1 className="mt-2 text-3xl font-semibold">Abonnements & paiements</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Gestion des offres, paiement sécurisé et suivi des transactions.
            Intégration cible: Stripe.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-3xl border border-border bg-white/90 p-6">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-2 text-2xl font-semibold text-primary">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Choisir {plan.name}
              </Button>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white/90 p-5">
            <p className="mb-2 flex items-center gap-2 font-medium">
              <Ticket className="h-4 w-4 text-primary" />
              Codes promo (F027 - phase suivante)
            </p>
            <p className="text-sm text-muted-foreground">
              Champ promo, validation serveur et tracking campagne.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-white/90 p-5">
            <p className="mb-2 flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Sécurité
            </p>
            <p className="text-sm text-muted-foreground">
              Tokens signés, webhooks vérifiés, journalisation anti-fraude.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
