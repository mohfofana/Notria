import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6 overflow-hidden">
      {/* Background gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 via-white to-white" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-100/40 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Texte */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Tutorat IA pour le BAC et BEPC
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              Ton prof personnel,{" "}
              <span className="text-amber-500">disponible 24/7</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Prof Ada t&apos;explique, te corrige et te prépare au BAC.
              Comme un vrai prof particulier, mais 100% gratuit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white h-14 px-8 text-base font-semibold rounded-xl shadow-lg shadow-amber-500/25">
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl border-slate-300 text-slate-700">
                Voir la démo
              </Button>
            </div>

            <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-500">
              <span>100% gratuit</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Sans carte bancaire</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Inscription en 2 min</span>
            </div>
          </div>

          {/* Mockup du chat */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden">
              {/* Barre supérieure du "téléphone" */}
              <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PA</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Prof Ada</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-green-400 text-xs">En ligne</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="px-4 py-5 space-y-4 bg-slate-50 min-h-[340px]">
                {/* Message élève */}
                <div className="flex justify-end">
                  <div className="bg-amber-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%] text-sm">
                    Je comprends pas les dérivées, tu peux m&apos;expliquer ?
                  </div>
                </div>

                {/* Message Prof Ada */}
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%] text-sm text-slate-700 shadow-sm">
                    <p>Bien sûr Fatou ! Imagine que tu es en moto. Tu regardes ton compteur : 60 km/h.</p>
                    <p className="mt-2">Cette vitesse, c&apos;est <strong>la dérivée</strong> de ta position. Elle mesure à quelle vitesse ta position change.</p>
                    <p className="mt-2">Pareil avec une fonction f(x) : sa dérivée f&apos;(x) mesure à quelle vitesse elle change.</p>
                    <p className="mt-2">On essaie avec un exemple concret ?</p>
                  </div>
                </div>

                {/* Message élève */}
                <div className="flex justify-end">
                  <div className="bg-amber-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%] text-sm">
                    Oui je vois ! On essaie avec f(x) = x² ?
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de saisie */}
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm text-slate-400">
                  Écris ton message...
                </div>
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 sm:mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-slate-900">500+</div>
            <div className="text-sm text-slate-500 mt-1">Élèves actifs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-slate-900">92%</div>
            <div className="text-sm text-slate-500 mt-1">Taux de réussite</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-amber-500">0 FCFA</div>
            <div className="text-sm text-slate-500 mt-1">Totalement gratuit</div>
          </div>
        </div>
      </div>
    </section>
  );
}
