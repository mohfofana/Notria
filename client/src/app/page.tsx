import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "4 500+", label: "eleves actifs" },
  { value: "12k+", label: "seances / semaine" },
  { value: "87%", label: "objectifs atteints" },
  { value: "4.8/5", label: "satisfaction" },
];

const features = [
  {
    icon: MessageSquare,
    title: "Prof Ada, ton IA perso",
    text: "Elle explique comme un bon prof : simple, clair, avec des exemples concrets.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Target,
    title: "Focus BEPC & BAC",
    text: "Chaque session cible les notions du programme ivoirien. Rien d'inutile.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: BookOpen,
    title: "Programme sur mesure",
    text: "4 semaines de sessions adaptees a ton niveau et tes objectifs.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: TrendingUp,
    title: "Suivi parent",
    text: "Le parent voit les progres, les efforts et les points a renforcer.",
    color: "bg-blue-500/10 text-blue-600",
  },
];

const steps = [
  {
    num: "01",
    title: "Inscris-toi",
    text: "Cree ton compte en 2 minutes. Choisis tes matieres et ton objectif.",
  },
  {
    num: "02",
    title: "Passe le diagnostic",
    text: "15 questions pour que Notria comprenne ton niveau et adapte ton parcours.",
  },
  {
    num: "03",
    title: "Apprends chaque jour",
    text: "10 a 20 min par jour suffisent. Prof Ada te guide pas a pas.",
  },
];

const faq = [
  {
    q: "Notria est pour qui ?",
    a: "Pour les eleves de 3e et Terminale qui veulent progresser et preparer le BEPC/BAC.",
  },
  {
    q: "Combien de temps par jour ?",
    a: "10 a 20 minutes suffisent pour garder un bon rythme de revision.",
  },
  {
    q: "Le parent peut suivre ?",
    a: "Oui. Le parent a son propre espace avec suivi des progres et notifications.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Warm gradient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute -right-24 top-48 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-400/6 blur-[100px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              N
            </span>
            <span className="text-xl font-bold tracking-tight font-display">Notria</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Fonctionnalites</a>
            <a href="#comment-ca-marche" className="transition-colors hover:text-foreground">Comment ca marche</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/connexion">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/inscription">
              <Button size="sm">
                Commencer
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative px-4 pb-16 pt-28 sm:px-6 sm:pt-36 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              IA specialisee pour le programme ivoirien
            </div>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Revise ton{" "}
              <span className="relative inline-block">
                <span className="relative z-10">BEPC</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 rounded-full bg-primary/20 sm:h-4" />
              </span>{" "}
              sans stress
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Prof Ada t&apos;accompagne chaque jour avec des sessions courtes et adaptees a ton niveau.
              Tu comprends vraiment, tu progresses vite.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/inscription">
                <Button size="xl" className="w-full sm:w-auto">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/connexion">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  J&apos;ai deja un compte
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 animate-slide-up delay-2" style={{ animationFillMode: "both" }}>
            {stats.map((item) => (
              <div key={item.label} className="n-card rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Hero visual: session preview */}
          <div className="mx-auto mt-12 max-w-2xl animate-slide-up delay-3" style={{ animationFillMode: "both" }}>
            <div className="n-shell rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">Seance du jour</p>
                  <p className="text-xs text-muted-foreground">Maths · Calcul numerique</p>
                </div>
                <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">En cours</span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <p className="text-sm">
                    <span className="font-semibold text-primary">Prof Ada</span>{" "}
                    <span className="text-muted-foreground">— Salut ! On va travailler les fractions aujourd&apos;hui. Tu preferes un rappel ou on passe direct a l&apos;exercice ?</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                    Rappel rapide
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                    Exercice guide
                  </span>
                  <span className="rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors">
                    Je suis bloque
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="fonctionnalites" className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Tout ce qu&apos;il te faut pour reussir
            </h2>
            <p className="mt-3 text-muted-foreground">
              Notria combine IA, programme ivoirien et pedagogie adaptee pour t&apos;aider a progresser chaque jour.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map((feat) => (
              <article key={feat.title} className="n-card rounded-2xl p-6 transition-shadow hover:shadow-lg">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feat.color}`}>
                  <feat.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feat.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feat.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Chalkboard Demo ─── */}
      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="n-shell rounded-2xl p-5 sm:p-7">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Exemple : resolution guidee</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Maths 3e</span>
            </div>
            <div className="chalkboard-root">
              <div className="chalkboard-panel">
                <p className="chalk-title chalk-line" style={{ animationDelay: "0.1s" }}>
                  Pythagore en 4 etapes
                </p>
                <p className="chalk-formula chalk-line" style={{ animationDelay: "0.45s" }}>
                  AC² = AB² + BC²
                </p>
                <p className="chalk-formula chalk-line" style={{ animationDelay: "0.8s" }}>
                  AC² = 3² + 4²
                </p>
                <p className="chalk-formula chalk-line" style={{ animationDelay: "1.1s" }}>
                  AC² = 9 + 16 = 25
                </p>
                <p className="chalk-formula chalk-highlight chalk-line" style={{ animationDelay: "1.45s" }}>
                  AC = √25 = 5 cm
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="comment-ca-marche" className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Comment ca marche
            </h2>
            <p className="mt-3 text-muted-foreground">
              Trois etapes pour commencer a progresser des aujourd&apos;hui.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.num} className="relative n-card rounded-2xl p-6">
                <span className="font-display text-4xl font-extrabold text-primary/15">{step.num}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-center sm:text-4xl">
            Questions frequentes
          </h2>

          <div className="mt-10 space-y-3">
            {faq.map((item) => (
              <article key={item.q} className="n-card rounded-2xl p-5">
                <p className="font-semibold">{item.q}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-4 pb-24 pt-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-10 sm:py-14">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/8" />

            <div className="relative">
              <GraduationCap className="mx-auto h-10 w-10 mb-4 opacity-90" />
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Pret a reussir ton examen ?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/80">
                Rejoins des milliers d&apos;eleves ivoiriens qui progressent chaque jour avec Notria.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/inscription">
                  <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg w-full sm:w-auto">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/parent/dashboard">
                  <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                    <Users className="mr-2 h-4 w-4" />
                    Espace parent
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white text-xs font-bold">N</span>
            <span className="text-sm font-semibold">Notria</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Fait avec soin a Abidjan pour les eleves de Cote d&apos;Ivoire.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/connexion" className="hover:text-foreground transition-colors">Connexion</Link>
            <Link href="/inscription" className="hover:text-foreground transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
