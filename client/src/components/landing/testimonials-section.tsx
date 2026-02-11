import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Fatou Koné",
    role: "Terminale C, Lycée Moderne d'Abobo",
    quote: "J'avais 9 en maths, j'ai fini l'année avec 15. Prof Ada m'explique les choses simplement, et les exercices après chaque séance m'ont beaucoup aidée.",
    stat: "9 → 15 en maths",
    initials: "FK",
    color: "bg-rose-100 text-rose-700",
  },
  {
    name: "Kouassi Bamba",
    role: "3ème, Collège Municipal de Yopougon",
    quote: "Le planning personnalisé m'a organisé. Avant je ne savais pas par quoi commencer. Maintenant j'ai un programme clair chaque jour.",
    stat: "BEPC Mention Bien",
    initials: "KB",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Adjoua Touré",
    role: "Mère d'élève en Terminale D",
    quote: "Je vois exactement ce que mon fils fait chaque semaine. Le résumé de Prof Ada me rassure. Et en plus c'est gratuit, c'est incroyable.",
    stat: "Suivi quotidien",
    initials: "AT",
    color: "bg-amber-100 text-amber-700",
  },
];

export function TestimonialsSection() {
  return (
    <section id="temoignages" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Témoignages</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ils progressent avec Notria
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-700 text-sm leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Stat badge */}
              <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full px-3 py-1 mb-5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {t.stat}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-slate-200">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
