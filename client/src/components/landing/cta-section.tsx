import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-900">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Ton BEPC, c&apos;est dans quelques mois.
          <br />
          <span className="text-amber-400">Commence aujourd&apos;hui.</span>
        </h2>

        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
          Chaque jour compte. Inscris-toi maintenant et commence ton programme d&apos;étude personnalisé avec Prof Ada.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/inscription">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white h-14 px-8 text-base font-semibold rounded-xl">
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          100% gratuit · Sans carte bancaire · Inscription en 2 min
        </p>
      </div>
    </section>
  );
}
