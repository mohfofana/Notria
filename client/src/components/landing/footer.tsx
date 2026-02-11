import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          {/* Logo */}
          <div className="sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Notria</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tutorat IA pour le BAC et BEPC en Côte d&apos;Ivoire.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Produit</h4>
            <ul className="space-y-2.5">
              <li><a href="#fonctionnalites" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Tarifs</a></li>
              <li><a href="#temoignages" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Témoignages</a></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Ressources</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Guide d&apos;utilisation</a></li>
              <li><a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">FAQ</a></li>
              <li><a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li><span className="text-slate-500 text-sm">+225 07 12 34 56 78</span></li>
              <li><a href="mailto:contact@notria.ci" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">contact@notria.ci</a></li>
              <li><span className="text-slate-500 text-sm">Abidjan, Côte d&apos;Ivoire</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-xs">
            © 2026 Notria. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Confidentialité</a>
            <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
