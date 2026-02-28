import Link from "next/link";
import {
  ArrowRight,
  Check,
  GraduationCap,
  ImageIcon,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "4 500+", label: "eleves de 3e actifs" },
  { value: "12k+", label: "seances chaque semaine" },
  { value: "87%", label: "objectifs valides" },
  { value: "4.8/5", label: "satisfaction familles" },
];

const promises = [
  "Des explications courtes et simples",
  "Des exercices guides, pas du blabla",
  "Un suivi clair pour l'eleve et le parent",
];

const faq = [
  {
    q: "Notria est pour qui ?",
    a: "Pour les eleves de 3e qui veulent progresser en maths et preparer le BEPC.",
  },
  {
    q: "Combien de temps par jour ?",
    a: "10 a 20 minutes suffisent pour garder un bon rythme.",
  },
  {
    q: "Le parent peut suivre ?",
    a: "Oui. Le parent voit les efforts, les progres et les points a renforcer.",
  },
];

function PlaceholderCard({
  tag,
  title,
  text,
}: {
  tag: string;
  title: string;
  text: string;
}) {
  return (
    <article className="soft-card rounded-3xl p-5 sm:p-6">
      <div className="aspect-[16/10] rounded-2xl border border-border/70 bg-gradient-to-br from-white via-muted/20 to-muted/80 p-3">
        <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-border/80 bg-white/70">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-2 h-8 w-8" />
            <p className="text-xs uppercase tracking-[0.18em]">{tag}</p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold leading-tight">{title}</p>
      <p className="mt-2 text-base text-muted-foreground">{text}</p>
    </article>
  );
}

function MiniBoard() {
  return (
    <article className="soft-shell rounded-3xl p-6 sm:p-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-lg font-semibold">Tableau de resolution</p>
        <span className="soft-chip rounded-full px-3 py-1 text-xs">cours anime</span>
      </div>

      <div className="chalkboard-root">
        <div className="chalkboard-panel">
          <p className="chalk-title chalk-line" style={{ animationDelay: "0.1s" }}>
            Pythagore en 4 etapes
          </p>
          <p className="chalk-formula chalk-line" style={{ animationDelay: "0.45s" }}>
            AC^2 = AB^2 + BC^2
          </p>
          <p className="chalk-formula chalk-line" style={{ animationDelay: "0.8s" }}>
            AC^2 = 3^2 + 4^2
          </p>
          <p className="chalk-formula chalk-line" style={{ animationDelay: "1.1s" }}>
            AC^2 = 9 + 16 = 25
          </p>
          <p className="chalk-formula chalk-highlight chalk-line" style={{ animationDelay: "1.45s" }}>
            AC = sqrt(25) = 5 cm
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[540px] overflow-hidden">
        <div className="absolute left-[6%] top-12 h-52 w-52 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute right-[8%] top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <header className="fixed inset-x-0 top-3 z-50 px-4 sm:px-6">
        <div className="soft-shell mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-2xl font-semibold tracking-tight">Notria</span>
          </Link>

          <nav className="hidden items-center gap-8 text-base text-muted-foreground md:flex">
            <a href="#pourquoi" className="transition-colors hover:text-foreground">Pourquoi</a>
            <a href="#espaces" className="transition-colors hover:text-foreground">Espaces</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/connexion">
              <Button variant="ghost" className="h-10 px-4 text-sm">Connexion</Button>
            </Link>
            <Link href="/inscription">
              <Button className="h-10 px-5 text-sm">Essayer</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-slide-up">
            <p className="soft-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              Specialement pense pour les eleves de 3e
            </p>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Reviser les maths
              <br />
              sans stress.
            </h1>

            <p className="mt-6 max-w-xl text-xl text-muted-foreground sm:text-2xl">
              Tu avances pas a pas, tu pratiques tout de suite, et tu comprends vraiment avant le BEPC.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inscription">
                <Button className="soft-focus-ring h-12 px-7 text-base">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" className="h-12 px-7 text-base">Voir un exemple</Button>
              </Link>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <article key={item.label} className="soft-card rounded-2xl px-4 py-3">
                  <p className="text-2xl font-semibold sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="animate-float-y">
            <div className="soft-shell rounded-3xl p-5 sm:p-6">
              <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-white via-muted/20 to-muted/65 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <p className="text-xl font-semibold">Seance du jour</p>
                  </div>
                  <span className="rounded-full border border-border/70 bg-white px-3 py-1 text-xs">Maths 3e</span>
                </div>

                <div className="space-y-3 text-base">
                  <div className="rounded-xl border border-border/80 bg-white/85 p-4">
                    Salut. On fait une seance courte de calcul numerique. Tu preferes rappel ou exercice ?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="soft-chip rounded-full px-3 py-1 text-xs">Rappel rapide</span>
                    <span className="soft-chip rounded-full px-3 py-1 text-xs">Exercice guide</span>
                    <span className="soft-chip rounded-full px-3 py-1 text-xs">Je suis bloque</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border/80 bg-white/75 p-3">
                  <p className="font-medium">Objectif</p>
                  <p className="mt-1 text-muted-foreground">Comprendre vite et retenir mieux.</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-white/75 p-3">
                  <p className="font-medium">Duree</p>
                  <p className="mt-1 text-muted-foreground">10 a 20 min par seance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pourquoi" className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-semibold sm:text-5xl">Ce que Notria change pour un eleve de 3e</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {promises.map((item) => (
              <article key={item} className="soft-card rounded-3xl p-6">
                <Check className="h-5 w-5 text-primary" />
                <p className="mt-4 text-lg font-semibold leading-snug">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="espaces" className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-4">
            <PlaceholderCard
              tag="eleve"
              title="Espace eleve"
              text="Cours, exercices et recap au meme endroit pour rester concentre."
            />
            <PlaceholderCard
              tag="parent"
              title="Espace parent"
              text="Vision simple des progres, des efforts et des notions a retravailler."
            />
          </div>

          <div className="space-y-4">
            <MiniBoard />
            <article className="soft-card rounded-3xl p-6">
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-semibold">Un langage simple</p>
                  <p className="mt-2 text-base text-muted-foreground">
                    Notria explique comme un bon prof: peu de texte, une question, puis une action.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 pb-20 pt-10 sm:px-6">
        <div className="soft-shell mx-auto max-w-6xl rounded-3xl p-6 sm:p-8">
          <h2 className="text-4xl font-semibold sm:text-5xl">Questions frequentes</h2>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {faq.map((item) => (
              <article key={item.q} className="soft-card rounded-2xl p-5">
                <p className="text-lg font-semibold">{item.q}</p>
                <p className="mt-2 text-base text-muted-foreground">{item.a}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-5">
            <div>
              <p className="text-xl font-semibold">Pret pour la prochaine etape ?</p>
              <p className="text-base text-muted-foreground">Lance une premiere seance en quelques minutes.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/parent/dashboard">
                <Button variant="outline" className="h-11 px-5">
                  <Users className="mr-2 h-4 w-4" />
                  Espace parent
                </Button>
              </Link>
              <Link href="/inscription">
                <Button className="h-11 px-5">
                  Commencer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <article className="soft-card rounded-2xl p-5">
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-3 text-lg font-semibold">Focus BEPC</p>
            <p className="mt-1 text-sm text-muted-foreground">Notions importantes, methodes claires, exos cibles.</p>
          </article>
          <article className="soft-card rounded-2xl p-5">
            <Users className="h-5 w-5 text-primary" />
            <p className="mt-3 text-lg font-semibold">Eleve + parent</p>
            <p className="mt-1 text-sm text-muted-foreground">Un meme parcours, deux vues adaptees.</p>
          </article>
          <article className="soft-card rounded-2xl p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-3 text-lg font-semibold">Simple et rassurant</p>
            <p className="mt-1 text-sm text-muted-foreground">Aucune complexite inutile, juste ce qui aide a reussir.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
