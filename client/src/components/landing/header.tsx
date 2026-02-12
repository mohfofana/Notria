import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Notria</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          <a href="#fonctionnalites" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Fonctionnalités
          </a>
          <a href="#comment-ca-marche" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Comment ça marche
          </a>
          <a href="#tarifs" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Tarifs
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/connexion">
            <Button variant="ghost" size="sm" className="text-slate-600 hidden sm:inline-flex">
              Connexion
            </Button>
          </Link>
          <Link href="/inscription">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
              Commencer
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
