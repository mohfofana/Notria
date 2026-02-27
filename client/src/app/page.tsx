import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    title: "Prof Ada",
    description:
      "Des explications pas a pas en francais simple, adaptees au niveau BEPC.",
    icon: Sparkles,
  },
  {
    title: "Notria Vision",
    description:
      "Prends un exercice en photo et recois une explication simple, sans rester bloque.",
    icon: Camera,
  },
  {
    title: "Suivi parent transparent",
    description:
      "Le parent voit le temps d'etude, les progres et les points d'attention en temps reel.",
    icon: Users,
  },
  {
    title: "Planning simple et adapte",
    description:
      "Un planning clair selon ton niveau et ta date d'examen.",
    icon: Clock3,
  },
];

const outcomes = [
  "Cours bases sur le programme officiel ivoirien",
  "Exercices progressifs avec correction claire",
  "BEPC blancs avec conseils simples",
  "Suivi eleve + parent dans la meme application",
];

const testimonials = [
  {
    quote:
      "Avant Notria, je revisais sans methode. Maintenant j'ai un plan clair chaque semaine et j'avance.",
    name: "Kouassi B.",
    role: "Eleve de 3eme",
  },
  {
    quote:
      "Je peux enfin suivre le travail de ma fille sans stress. Le tableau parent est tres rassurant.",
    name: "Ahou M.",
    role: "Parent d'eleve",
  },
  {
    quote:
      "Le mode photo m'a sauvee en maths. Les explications sont directes et faciles a retenir.",
    name: "Fatou K.",
    role: "Terminale D",
  },
];

const faqs = [
  {
    q: "Notria est-elle adaptee au programme BEPC ivoirien ?",
    a: "Oui. Notria est faite pour le BEPC ivoirien, avec des explications simples et proches du cours.",
  },
  {
    q: "Un parent peut-il suivre la progression en direct ?",
    a: "Oui. L'espace parent montre le temps d'etude, les progres et les alertes importantes.",
  },
  {
    q: "Puis-je commencer gratuitement ?",
    a: "Oui. L'inscription est rapide et permet de tester le parcours complet des le premier jour.",
  },
];

function SectionArrow() {
  return (
    <div className="pointer-events-none flex justify-center py-0">
      <svg
        width="36"
        height="64"
        viewBox="0 0 36 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-75"
      >
        <path
          d="M18 6C17 14 19 20 18 29C17 38 19 45 18 54"
          stroke="#0F766E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M11 47L18 56"
          stroke="#0F766E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M25 47L18 56"
          stroke="#0F766E"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type TabletFrameProps = {
  src: string;
  alt: string;
  sizes: string;
  maxWidthClass?: string;
};

function TabletFrame({ src, alt, sizes, maxWidthClass = "max-w-full" }: TabletFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full ${maxWidthClass} rounded-[1.8rem] border-[6px] border-[#F8FBFA] bg-[#F8FBFA] p-1 shadow-[0_14px_30px_-16px_rgba(15,23,42,0.35)] ring-1 ring-slate-300`}
    >
      <span className="pointer-events-none absolute left-1/2 top-1 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-300" />
      <div className="relative aspect-[16/9] overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
        <Image
          src={src}
          alt={alt}
          fill
          quality={100}
          sizes={sizes}
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FBFA] text-foreground">
      <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between rounded-2xl border border-border/70 bg-white/90 px-4 shadow-lg backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg tracking-tight">Notria</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnalites" className="hover:text-foreground">
              Fonctionnalites
            </a>
            <a href="#vision" className="hover:text-foreground">
              Vision
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/connexion">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="/inscription">
              <Button size="sm">Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-slide-up space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/85 px-4 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Soutien scolaire pour eleves ivoiriens
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Aider chaque eleve a reussir son BEPC.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Notria aide chaque eleve a apprendre tous les jours, avec des explications claires.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/inscription">
                <Button className="h-12 px-6 text-base">
                  Creer mon compte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" className="h-12 px-6 text-base">
                  Tester Prof Ada
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Inscription en quelques minutes
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Disponible 24h/24
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Suivi eleve + parent
              </span>
            </div>
          </div>

          <div className="animate-float-y relative w-full max-w-[420px] p-3 lg:ml-auto lg:mr-0">
            <div className="pointer-events-none absolute -inset-1 rounded-[2.1rem] border-2 border-primary/35 rotate-[-1.5deg]" />
            <div className="pointer-events-none absolute -inset-2 rounded-[2.2rem] border border-primary/25 rotate-[1.2deg]" />
            <div className="pointer-events-none absolute -inset-3 rounded-[2.3rem] border border-dashed border-primary/30 rotate-[-0.8deg]" />
            <div className="relative overflow-hidden rounded-[1.6rem] border-2 border-white/80 bg-muted/20 shadow-xl shadow-primary/15">
              <Image
                src="/illustrations/fatou_sucess.png"
                alt="Fatou, eleve ayant reussi son diplome grace a Notria"
                width={900}
                height={1200}
                className="h-auto w-full aspect-[4/5] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <SectionArrow />

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Apercu de l'application
            </p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Les ecrans de l'application
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <article className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm lg:col-span-7">
              <div className="px-2 pt-2">
                <TabletFrame
                  src="/illustrations/chat_eleve.png"
                  alt="Conversation eleve avec Prof Ada"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">Chat eleve avec Prof Ada</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Le cours, les exercices et les explications sont au meme endroit.
                </p>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm lg:col-span-5">
              <div className="px-2 pt-2">
                <TabletFrame
                  src="/illustrations/notria_vision.png"
                  alt="Notria Vision pour corriger un devoir BEPC"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">Notria Vision</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu prends une photo du devoir, Notria t'explique la correction.
                </p>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm lg:col-span-12">
              <div className="px-2 pt-2">
                <TabletFrame
                  src="/illustrations/inscription.png"
                  alt="Inscription Notria"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  maxWidthClass="max-w-[980px]"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">Inscription rapide</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Le parcours de creation de compte est court et guide.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <SectionArrow />

      <section id="fonctionnalites" className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Fonctionnalites</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Tout ce qu'il faut pour bien preparer le BEPC
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-border/80 bg-white/90 p-5">
                <pillar.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pillar.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-white/85 p-5">
            <p className="mb-3 text-sm font-medium">Ce que les eleves obtiennent concretement</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <p key={outcome} className="inline-flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {outcome}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="overflow-hidden rounded-2xl border border-border bg-white/90">
              <div className="px-2 pt-2">
                <TabletFrame
                  src="/illustrations/espace_bepc.png"
                  alt="Notria Vision pour corriger un devoir BEPC"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">Notria Vision, tres simple</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  1 photo du devoir, puis Notria t'explique clairement chaque etape.
                </p>
              </div>
            </article>
            <article className="overflow-hidden rounded-2xl border border-border bg-white/90">
              <div className="px-2 pt-2">
                <TabletFrame
                  src="/illustrations/espace_parent.png"
                  alt="Espace parent Notria avec suivi de progression"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">Espace parent</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Progres, alertes et rapport de la semaine.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="vision" className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-white/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Notre vision</p>
            <h2 className="mt-2 text-3xl font-semibold">Aider plus d'eleves a reussir</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Nous voulons une application utile, locale et facile a utiliser pour chaque famille.
              Le plus important: comprendre ses cours et progresser chaque semaine.
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-border bg-muted/35 p-4">
                <p className="flex items-center gap-2 font-medium">
                  <Target className="h-4 w-4 text-primary" />
                  Priorite resultat
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plus de regularite, plus de confiance, plus de reussite a l'examen.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/35 p-4">
                <p className="flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 text-primary" />
                  Priorite simplicite
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Une application claire et utile des le premier jour.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-primary p-6 text-primary-foreground">
            <h3 className="text-2xl font-semibold">Pourquoi les familles choisissent Notria</h3>
            <div className="mt-5 space-y-3 text-sm text-primary-foreground/90">
              <p className="inline-flex items-start gap-2">
                <Mic className="mt-0.5 h-4 w-4 shrink-0" />
                Echange simple par message, avec un accompagnement motive.
              </p>
              <p className="inline-flex items-start gap-2">
                <Camera className="mt-0.5 h-4 w-4 shrink-0" />
                Tu prends ton devoir en photo, et Notria montre ou tu t'es trompe.
              </p>
              <p className="inline-flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0" />
                Visibilite parentale claire sur le travail de l'eleve.
              </p>
            </div>
            <Link href="/inscription" className="mt-6 inline-flex">
              <Button className="bg-white text-primary hover:bg-white/90">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </article>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="mb-6 text-3xl font-semibold">Ils parlent de leur progression</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl border border-border bg-white/90 p-5">
                <p className="text-sm text-muted-foreground">"{item.quote}"</p>
                <p className="mt-4 font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 pb-16 pt-12 sm:px-6">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-border bg-white/90 p-6 sm:p-8">
          <h2 className="text-3xl font-semibold">Questions frequentes</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <article key={faq.q} className="rounded-xl border border-border p-4">
                <p className="font-medium">{faq.q}</p>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm">Pret a commencer avec Prof Ada ?</p>
            <Link href="/inscription">
              <Button>
                Je commence maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
