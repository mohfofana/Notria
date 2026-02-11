import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratuit",
    price: "0",
    description: "Pour découvrir Prof Ada",
    features: [
      "5 messages/jour avec Prof Ada",
      "2 exercices/jour",
      "Historique limité",
    ],
    highlighted: false,
    cta: "Commencer",
  },
  {
    name: "Standard",
    price: "2,000",
    description: "Pour progresser sérieusement",
    badge: "Populaire",
    features: [
      "100 messages/jour avec Prof Ada",
      "20 exercices/jour",
      "Programme d'étude complet",
      "Planning personnalisé",
      "Suivi de progression détaillé",
    ],
    highlighted: true,
    cta: "Essayer 7 jours gratuit",
  },
  {
    name: "Premium",
    price: "3,500",
    description: "Pour viser la mention",
    features: [
      "Messages et exercices illimités",
      "Tout le plan Standard",
      "Dashboard parent",
      "Devoirs adaptatifs avancés",
      "Support prioritaire",
    ],
    highlighted: false,
    cta: "Essayer 7 jours gratuit",
  },
];

export function PricingSection() {
  return (
    <section id="tarifs" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Tarifs</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Un prix accessible pour tous
          </h2>
          <p className="text-slate-600 text-lg">
            7 jours d&apos;essai gratuit sur tous les plans payants. Sans carte bancaire.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-slate-900 text-white ring-2 ring-amber-500 shadow-xl"
                  : "bg-white border border-slate-200"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                  FCFA/mois
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-amber-400" : "text-green-600"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-slate-300" : "text-slate-600"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 font-semibold rounded-xl ${
                  plan.highlighted
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Annulation à tout moment. Aucun engagement.
        </p>
      </div>
    </section>
  );
}
