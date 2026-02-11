import { UserPlus, MessageCircle, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Inscris-toi en 2 min",
    description: "Choisis ta classe, tes matières et ton objectif. Prof Ada évalue ton niveau avec un test rapide.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Étudie avec Prof Ada",
    description: "Pose tes questions, fais des exercices, reçois des devoirs. Prof Ada s'adapte à ton niveau en temps réel.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Progresse chaque semaine",
    description: "Suis ta progression, respecte ton planning et regarde tes notes monter jusqu'au jour de l'examen.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Comment ça marche</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Prêt en 3 étapes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center md:text-left">
              {/* Connecteur entre les étapes (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[calc(100%-20%)] h-px bg-slate-200" />
              )}

              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-2xl mb-6 mx-auto md:mx-0">
                <step.icon className="w-8 h-8 text-amber-600" />
                <span className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-slate-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed max-w-xs mx-auto md:mx-0">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
