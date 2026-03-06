import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Lightbulb,
  PenLine,
  MessageSquareText,
  Minus,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  { name: "Awa", text: "Avant j'evitais les revisions. Maintenant j'ouvre Notria tous les soirs.", img: "/images/students/student-portrait-1.jpg" },
  { name: "Yao", text: "Les objectifs sont clairs et les sessions sont courtes. Je tiens le rythme.", img: "/images/students/student-portrait-2.jpg" },
  { name: "Fatou", text: "Je comprends plus vite en Maths. Les explications sont directes.", img: "/images/students/student-portrait-3.jpg" },
];

const features = [
  {
    icon: MessageSquareText,
    title: "Chat avec Prof Ada",
    desc: "Pose tes questions en francais. Prof Ada explique et guide sans donner la reponse brute.",
  },
  {
    icon: Target,
    title: "Exercices adaptatifs",
    desc: "Exercices alignes BEPC ivoirien. La difficulte s'ajuste a ton niveau.",
  },
  {
    icon: CalendarCheck,
    title: "Programme sur mesure",
    desc: "Plan d'etude sur 16 semaines jusqu'a l'examen, reajuste selon ta progression.",
  },
  {
    icon: ClipboardCheck,
    title: "Devoirs apres chaque seance",
    desc: "3 a 5 exercices cibles, puis correction a la seance suivante.",
  },
  {
    icon: Users,
    title: "Dashboard parent",
    desc: "Les parents suivent les efforts et la progression en temps reel.",
  },
  {
    icon: Star,
    title: "Gamification utile",
    desc: "XP, series et objectifs pour motiver sans distraire de l'apprentissage.",
  },
];

const steps = [
  {
    n: "01",
    title: "Inscris-toi en 2 min",
    desc: "Choisis ta classe, tes matieres et ton objectif.",
  },
  {
    n: "02",
    title: "Etudie avec Prof Ada",
    desc: "Chat, exercices, devoirs et explications adaptees a ton niveau.",
  },
  {
    n: "03",
    title: "Progresse chaque semaine",
    desc: "Suis ton plan, vois tes points forts et ce qu'il faut retravailler.",
  },
];

const comparisonRows = [
  { label: "Disponible 24/7", notria: true, prof: false, solo: false },
  { label: "Programme ivoirien", notria: true, prof: true, solo: false },
  { label: "Correction instantanee", notria: true, prof: false, solo: false },
  { label: "Suivi progression", notria: true, prof: false, solo: false },
  { label: "Dashboard parent", notria: true, prof: false, solo: false },
  { label: "Prix", notria: "Gratuit", prof: "25 000+ FCFA/mois", solo: "Gratuit" },
];

const faq = [
  { q: "Notria est pour qui ?", a: "Pour les eleves de 3e qui preparent le BEPC en Cote d'Ivoire." },
  { q: "Quelles matieres sont disponibles ?", a: "Maths, Francais, SVT, Physique-Chimie." },
  { q: "C'est payant ?", a: "Le lancement est gratuit actuellement." },
  { q: "Les parents peuvent suivre ?", a: "Oui, avec un dashboard dedie parent." },
];

function TableCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-600" />;
  if (value === false) return <X className="h-4 w-4 text-slate-300" />;
  if (value === "partial") return <Minus className="h-4 w-4 text-amber-500" />;
  return <span className="text-xs font-semibold text-slate-800">{value}</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-900 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold">Notria</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/connexion"><Button variant="ghost">Connexion</Button></Link>
            <Link href="/inscription"><Button variant="accent">Commencer</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
        <div className="absolute right-[-100px] top-[80px] h-72 w-72 rounded-full bg-orange-300/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[24%] rounded-full bg-white/60 p-4 shadow-sm">
            <Lightbulb className="h-7 w-7 text-orange-400/70" />
          </div>
          <div className="absolute right-[10%] top-[20%] rounded-full bg-white/60 p-4 shadow-sm">
            <PenLine className="h-7 w-7 text-indigo-500/70" />
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-14">
          <div className="animate-fade-slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800">
              <Sparkles className="h-4 w-4" />
              Pour les eleves de 3e en Cote d'Ivoire
            </p>
            <h1 className="text-5xl font-semibold leading-[0.98] sm:text-6xl">
              Reviser le BEPC
              <br />
              devient plus simple,
              <br />
              plus motivant.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Notria aide les jeunes de 3e (en general 14 a 16 ans) avec un parcours clair: explications courtes, exercices, planning et suivi parent.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/inscription">
                <Button variant="accent" className="h-12 px-6 text-base">
                  Tester gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard"><Button variant="outline" className="h-12 px-6 text-base">Voir le dashboard</Button></Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-semibold text-indigo-800">4 500+</p><p className="text-xs text-slate-500">eleves actifs</p></div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-semibold text-orange-600">92%</p><p className="text-xs text-slate-500">progres visibles</p></div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-semibold text-emerald-600">10-20m</p><p className="text-xs text-slate-500">par session</p></div>
            </div>
          </div>
          <div className="animate-float-y">
            <div className="relative overflow-hidden rounded-[28px] bg-white p-3 shadow-2xl ring-1 ring-slate-200">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src="/images/students/hero-students.jpg" alt="Eleves ivoiriens en revision" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/20 p-3 text-white backdrop-blur">
                  <p className="text-xs uppercase tracking-wide">Session active</p>
                  <p className="text-lg font-semibold">Physique-Chimie: Acides et bases</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 sm:px-6 md:grid-cols-3">
        <article className="rounded-3xl bg-indigo-900 p-6 text-white shadow-lg">
          <Flame className="h-5 w-5 text-orange-300" />
          <h3 className="mt-3 text-2xl font-semibold">Serie quotidienne</h3>
          <p className="mt-2 text-indigo-100">Chaque jour complete = streak + XP + confiance.</p>
        </article>
        <article className="rounded-3xl bg-orange-500 p-6 text-white shadow-lg">
          <Trophy className="h-5 w-5 text-orange-100" />
          <h3 className="mt-3 text-2xl font-semibold">Defis hebdo</h3>
          <p className="mt-2 text-orange-100">Des mini-objectifs pour rester motive sans surcharge.</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <Star className="h-5 w-5 text-indigo-700" />
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">Feedback direct</h3>
          <p className="mt-2 text-slate-600">Tu vois vite ce qui est acquis et ce qu'il faut retravailler.</p>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 text-4xl font-semibold">Fonctionnalites</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-200">
              <f.icon className="h-5 w-5 text-indigo-700" />
              <p className="mt-3 font-semibold">{f.title}</p>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200">
          <h2 className="text-3xl font-semibold">Matieres BEPC</h2>
          <p className="mt-2 text-slate-600">Contenu pense pour le programme de 3e en Cote d'Ivoire.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Mathematiques</span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">Francais</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">SVT</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">Physique-Chimie</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 text-4xl font-semibold">Comment ca marche</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <article key={s.n} className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">{s.n}</p>
              <p className="mt-4 text-xl font-semibold">{s.title}</p>
              <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 text-4xl font-semibold">Comparaison</h2>
        <div className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Critere</th>
                <th className="px-4 py-3 text-center">Notria</th>
                <th className="px-4 py-3 text-center">Prof particulier</th>
                <th className="px-4 py-3 text-center">Etudier seul</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3"><div className="flex justify-center"><TableCell value={row.notria} /></div></td>
                  <td className="px-4 py-3"><div className="flex justify-center"><TableCell value={row.prof} /></div></td>
                  <td className="px-4 py-3"><div className="flex justify-center"><TableCell value={row.solo} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 text-4xl font-semibold">Tarifs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-indigo-900 p-6 text-white shadow-lg">
            <p className="text-sm uppercase tracking-wide text-indigo-200">Gratuit (beta)</p>
            <p className="mt-2 text-4xl font-semibold">0 FCFA</p>
            <ul className="mt-4 space-y-2 text-indigo-100">
              <li>Chat avec Prof Ada</li>
              <li>Exercices et corrections</li>
              <li>Programme + planning</li>
            </ul>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <p className="text-sm uppercase tracking-wide text-slate-500">Premium (plus tard)</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">Bientot</p>
            <ul className="mt-4 space-y-2 text-slate-600">
              <li>Dashboard parent avance</li>
              <li>Devoirs adaptatifs avances</li>
              <li>Support prioritaire</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-4xl font-semibold">Temoignages eleves</h2>
          <p className="text-sm text-slate-500">Ce n'est pas un template froid</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <article key={t.name} className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-200">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image src={t.img} alt={t.name} fill className="object-cover" />
                </div>
                <p className="font-semibold">{t.name}</p>
              </div>
              <p className="text-slate-600">{t.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="mb-6 text-4xl font-semibold">FAQ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <article key={item.q} className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-200">
              <p className="font-semibold">{item.q}</p>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 p-6 text-white sm:grid-cols-2 sm:p-8">
          <div className="relative min-h-[230px] overflow-hidden rounded-2xl">
            <Image src="/images/students/focused-studying.jpg" alt="Eleve concentre sur son travail" fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold">Ton BEPC est dans quelques mois. Commence aujourd'hui.</h2>
            <p className="mt-3 text-indigo-100">Inscription rapide, sans paiement, avec un parcours clair des la premiere session.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/inscription"><Button variant="accent">Commencer</Button></Link>
              <Link href="/connexion"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Se connecter</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
