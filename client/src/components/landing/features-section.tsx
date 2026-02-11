import {
  MessageSquareText,
  Brain,
  CalendarCheck,
  Target,
  ClipboardCheck,
  Users,
} from "lucide-react";

const features = [
  {
    icon: MessageSquareText,
    title: "Chat avec Prof Ada",
    description: "Pose tes questions en français à ton tuteur IA. Elle t'explique, te guide et ne donne jamais la réponse directement.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Brain,
    title: "Exercices adaptatifs",
    description: "Des exercices conformes au programme BAC/BEPC ivoirien. La difficulté s'ajuste automatiquement à ton niveau.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Target,
    title: "Programme sur mesure",
    description: "Un plan d'étude de 16 semaines jusqu'à l'examen. L'IA réajuste chaque semaine selon ta progression.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: CalendarCheck,
    title: "Ton emploi du temps",
    description: "Choisis tes jours, ton heure et ta durée. Notria organise automatiquement tes matières et te rappelle.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: ClipboardCheck,
    title: "Devoirs après chaque séance",
    description: "Prof Ada te donne 3 à 5 exercices ciblés après chaque cours. Elle vérifie tes devoirs à la séance suivante.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Users,
    title: "Dashboard parent",
    description: "Tes parents suivent ta progression en temps réel. Résumé hebdomadaire automatique par l'IA.",
    color: "bg-sky-50 text-sky-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Fonctionnalités</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Tout pour réussir ton examen
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Prof Ada combine le meilleur d&apos;un prof particulier avec la puissance de l&apos;intelligence artificielle.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
