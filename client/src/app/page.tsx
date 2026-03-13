"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════════════
   SVG ILLUSTRATIONS — Rich, hand-crafted Ivorian-themed illustrations
   ═══════════════════════════════════════════════════════════════════════ */

/** Baoulé-inspired geometric border divider */
function AfricanDivider({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-full ${className}`} height="32" viewBox="0 0 800 32" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <line x1="0" y1="16" x2="280" y2="16" stroke="#D97706" strokeWidth="1" opacity="0.3" />
      <line x1="520" y1="16" x2="800" y2="16" stroke="#D97706" strokeWidth="1" opacity="0.3" />
      {/* Central Adinkra-inspired motif */}
      <g transform="translate(400,16)">
        <path d="M0,-14 L14,0 L0,14 L-14,0 Z" stroke="#D97706" strokeWidth="1.5" fill="none" />
        <path d="M0,-8 L8,0 L0,8 L-8,0 Z" stroke="#059669" strokeWidth="1.5" fill="none" />
        <circle cx="0" cy="0" r="2.5" fill="#D97706" />
        {/* Side diamonds */}
        <g transform="translate(-30,0)">
          <path d="M0,-6 L6,0 L0,6 L-6,0 Z" stroke="#D97706" strokeWidth="1" fill="none" opacity="0.6" />
        </g>
        <g transform="translate(30,0)">
          <path d="M0,-6 L6,0 L0,6 L-6,0 Z" stroke="#D97706" strokeWidth="1" fill="none" opacity="0.6" />
        </g>
        <g transform="translate(-56,0)">
          <path d="M0,-4 L4,0 L0,4 L-4,0 Z" stroke="#059669" strokeWidth="1" fill="none" opacity="0.4" />
        </g>
        <g transform="translate(56,0)">
          <path d="M0,-4 L4,0 L0,4 L-4,0 Z" stroke="#059669" strokeWidth="1" fill="none" opacity="0.4" />
        </g>
        <g transform="translate(-78,0)">
          <circle cx="0" cy="0" r="2" fill="#D97706" opacity="0.3" />
        </g>
        <g transform="translate(78,0)">
          <circle cx="0" cy="0" r="2" fill="#D97706" opacity="0.3" />
        </g>
      </g>
    </svg>
  );
}

/** Prof Ada illustration — friendly AI tutor character */
function ProfAdaIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 220" fill="none" aria-hidden>
      {/* Glow behind */}
      <circle cx="100" cy="110" r="85" fill="#FFF7ED" />
      <circle cx="100" cy="110" r="70" fill="#FFEDD5" />
      {/* Body */}
      <path d="M60,180 Q60,145 80,135 L120,135 Q140,145 140,180 Z" fill="#059669" />
      {/* Collar detail */}
      <path d="M85,135 L100,150 L115,135" stroke="#047857" strokeWidth="2" fill="none" />
      {/* Head */}
      <circle cx="100" cy="100" r="40" fill="#92400E" />
      {/* Hair — short curly */}
      <ellipse cx="100" cy="68" rx="38" ry="20" fill="#451A03" />
      <circle cx="68" cy="80" r="10" fill="#451A03" />
      <circle cx="132" cy="80" r="10" fill="#451A03" />
      {/* Face */}
      <ellipse cx="86" cy="100" rx="5" ry="6" fill="#451A03" /> {/* Left eye */}
      <ellipse cx="114" cy="100" rx="5" ry="6" fill="#451A03" /> {/* Right eye */}
      <ellipse cx="87" cy="98" rx="2" ry="2.5" fill="white" /> {/* Eye shine */}
      <ellipse cx="115" cy="98" rx="2" ry="2.5" fill="white" />
      {/* Smile */}
      <path d="M88,115 Q100,128 112,115" stroke="#451A03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Glasses */}
      <circle cx="86" cy="100" r="12" stroke="#D97706" strokeWidth="2" fill="none" />
      <circle cx="114" cy="100" r="12" stroke="#D97706" strokeWidth="2" fill="none" />
      <line x1="98" y1="100" x2="102" y2="100" stroke="#D97706" strokeWidth="2" />
      {/* Tablet in hand */}
      <rect x="55" y="155" rx="4" ry="4" width="35" height="25" fill="#1E293B" stroke="#334155" strokeWidth="1" />
      <rect x="58" y="158" rx="2" ry="2" width="29" height="16" fill="#3B82F6" opacity="0.6" />
      {/* Sparkle */}
      <g transform="translate(150,75)">
        <path d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" fill="#D97706" opacity="0.7" />
      </g>
      <g transform="translate(45,70)">
        <path d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z" fill="#059669" opacity="0.5" />
      </g>
    </svg>
  );
}

/** Student studying illustration */
function StudentStudyingIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 260 200" fill="none" aria-hidden>
      {/* Desk */}
      <rect x="30" y="130" rx="4" width="200" height="10" fill="#92400E" />
      <rect x="40" y="140" width="8" height="50" fill="#78350F" />
      <rect x="212" y="140" width="8" height="50" fill="#78350F" />
      {/* Open book */}
      <path d="M80,125 Q110,115 130,125 L130,80 Q110,70 80,80 Z" fill="white" stroke="#D6D3D1" strokeWidth="1" />
      <path d="M130,125 Q150,115 180,125 L180,80 Q150,70 130,80 Z" fill="#FFF7ED" stroke="#D6D3D1" strokeWidth="1" />
      {/* Book lines */}
      <line x1="90" y1="90" x2="125" y2="86" stroke="#D6D3D1" strokeWidth="1" />
      <line x1="90" y1="98" x2="125" y2="94" stroke="#D6D3D1" strokeWidth="1" />
      <line x1="90" y1="106" x2="125" y2="102" stroke="#D6D3D1" strokeWidth="1" />
      <line x1="135" y1="86" x2="170" y2="90" stroke="#D6D3D1" strokeWidth="1" />
      <line x1="135" y1="94" x2="170" y2="98" stroke="#D6D3D1" strokeWidth="1" />
      {/* Student head */}
      <circle cx="130" cy="50" r="28" fill="#92400E" />
      {/* Hair */}
      <ellipse cx="130" cy="30" rx="26" ry="14" fill="#451A03" />
      {/* Eyes looking down at book */}
      <ellipse cx="122" cy="52" rx="3" ry="4" fill="#451A03" />
      <ellipse cx="138" cy="52" rx="3" ry="4" fill="#451A03" />
      {/* Small smile */}
      <path d="M123,62 Q130,68 137,62" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Phone on desk with Notria */}
      <rect x="185" y="110" rx="3" width="22" height="18" fill="#1E293B" />
      <rect x="187" y="112" rx="1" width="18" height="12" fill="#D97706" opacity="0.5" />
      {/* Pencil */}
      <line x1="65" y1="128" x2="50" y2="110" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="110" x2="48" y2="106" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      {/* Light bulb moment */}
      <g transform="translate(165,25)" opacity="0.8">
        <circle cx="0" cy="0" r="10" fill="#FEF3C7" />
        <path d="M0,-6 L1,-1 L6,0 L1,1 L0,6 L-1,1 L-6,0 L-1,-1 Z" fill="#D97706" />
      </g>
    </svg>
  );
}

/** Tricolor bar — Ivorian flag */
function TricolorBar() {
  return (
    <div className="flex h-1.5 w-full" aria-hidden>
      <div className="flex-1 bg-[#F77F00]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#009E60]" />
    </div>
  );
}

/** Floating book illustration for sections */
function BookStackIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" fill="none" aria-hidden>
      <rect x="15" y="50" rx="3" width="90" height="14" fill="#059669" transform="rotate(-3 60 57)" />
      <rect x="10" y="38" rx="3" width="95" height="14" fill="#D97706" transform="rotate(2 57 45)" />
      <rect x="18" y="26" rx="3" width="85" height="14" fill="#0D9488" transform="rotate(-1 60 33)" />
      <rect x="12" y="14" rx="3" width="92" height="14" fill="#B45309" transform="rotate(1.5 58 21)" />
      {/* Pencil on top */}
      <line x1="75" y1="12" x2="100" y2="3" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="3" x2="103" y2="1" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════ */

const howItWorks = [
  {
    n: "01",
    title: "Tu t'inscris tranquille",
    desc: "2 minutes, on te demande juste ta classe et tes matieres. Meme dans le gbaka tu peux le faire.",
    illustration: "signup",
  },
  {
    n: "02",
    title: "Ada te fait cours",
    desc: "Chaque jour, elle te sort un vrai cours + des exercices adaptes a ton niveau. 15-20 min max.",
    illustration: "study",
  },
  {
    n: "03",
    title: "Tu vois ta progression",
    desc: "Semaine apres semaine, tu sais exactement ou tu en es. Tes parents aussi.",
    illustration: "progress",
  },
];

const subjects = [
  { name: "Maths", full: "Mathematiques", emoji: "📐", color: "from-orange-500 to-amber-500", bg: "bg-orange-50 border-orange-200" },
  { name: "Francais", full: "Francais", emoji: "📝", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 border-emerald-200" },
  { name: "SVT", full: "Sciences de la Vie et de la Terre", emoji: "🌿", color: "from-lime-500 to-green-500", bg: "bg-lime-50 border-lime-200" },
  { name: "Physique-Chimie", full: "Physique-Chimie", emoji: "⚗️", color: "from-sky-500 to-blue-500", bg: "bg-sky-50 border-sky-200" },
  { name: "Anglais", full: "Anglais", emoji: "🗣️", color: "from-violet-500 to-purple-500", bg: "bg-violet-50 border-violet-200" },
];

const features = [
  {
    icon: MessageCircle,
    title: "Prof Ada te parle comme un vrai prof",
    desc: "Tu comprends pas ? Demande-lui. Elle va t'expliquer calmement, sans te juger. Comme une grande soeur qui connait tout le programme.",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    icon: Target,
    title: "Exercices du vrai programme BEPC",
    desc: "C'est pas des exercices random d'internet. C'est le programme officiel ivoirien. Ce qu'on va te poser a l'examen.",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    icon: BookOpen,
    title: "Des vrais cours, pas 3 lignes",
    desc: "Definitions, exemples resolus, methodes, erreurs a eviter. Un vrai cours complet que tu peux relire avant l'examen.",
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    icon: Brain,
    title: "Tu te trompes ? C'est normal",
    desc: "Ada re-explique autrement. Elle te donne un autre exemple. Elle te guide pas a pas. Tu finiras par comprendre, c'est garanti.",
    color: "text-teal-600",
    bg: "bg-teal-100",
  },
  {
    icon: Users,
    title: "Tes parents voient tout",
    desc: "Y'a un espace parent. Ils voient ta progression, tes efforts, tes resultats. Plus besoin qu'ils te demandent 'tu as revise ?'",
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
  {
    icon: Trophy,
    title: "Tu gagnes des XP chaque jour",
    desc: "Points, series, niveaux. Chaque jour que tu revises, tu montes. C'est comme un jeu mais tu apprends pour de vrai.",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
];

const comparisonFeatures = [
  { label: "Disponible 24h/24", notria: true, prof: false, solo: false },
  { label: "Programme BEPC officiel", notria: true, prof: true, solo: false },
  { label: "Correction immediate", notria: true, prof: false, solo: false },
  { label: "S'adapte a ton niveau", notria: true, prof: "partial", solo: false },
  { label: "Suivi de la progression", notria: true, prof: false, solo: false },
  { label: "Espace parent", notria: true, prof: false, solo: false },
  { label: "Prix", notria: "0 FCFA", prof: "25 000+", solo: "0 FCFA" },
];

const testimonials = [
  {
    name: "Awa K.",
    lieu: "Yopougon, Abidjan",
    text: "Avant, reviser c'etait la galere pour moi. Maintenant j'ouvre Notria chaque soir apres manger. Les explications sont claires, on comprend vite fait.",
    img: "/images/students/student-portrait-1.jpg",
  },
  {
    name: "Kouame Y.",
    lieu: "Cocody, Abidjan",
    text: "Moi c'est les sessions courtes qui me plaisent. 15 minutes et c'est bon. Meme ma mere a vu que mes notes ont monte.",
    img: "/images/students/student-portrait-2.jpg",
  },
  {
    name: "Fatou D.",
    lieu: "Yamoussoukro",
    text: "Les maths c'etait mon pire cauchemar. Avec Ada, quand je me trompe elle m'explique autrement. Maintenant ca rentre mieux.",
    img: "/images/students/student-portrait-3.jpg",
  },
  {
    name: "Seydou T.",
    lieu: "Bouake",
    text: "Ce qui est bien c'est que c'est le vrai programme du BEPC. Tu revises pas des trucs au hasard. C'est ce qu'il faut pour l'examen.",
    img: "/images/students/student-portrait-4.jpg",
  },
];

const faq = [
  {
    q: "C'est pour qui Notria ?",
    a: "Pour toi si tu es en 3eme et tu prepares le BEPC en Cote d'Ivoire. Que tu sois premier de la classe ou que tu galeres, Ada s'adapte a toi.",
  },
  {
    q: "C'est vraiment a 0 franc ?",
    a: "Oui mon frere. Pendant la beta, tout est gratuit. Toutes les matieres, tous les cours, les exercices, le suivi — tu paies rien du tout.",
  },
  {
    q: "Y a quelles matieres ?",
    a: "Les 5 grosses matieres du BEPC : Maths, Francais, SVT, Physique-Chimie et Anglais. Tout le programme officiel ivoirien.",
  },
  {
    q: "Ca prend combien de temps par jour ?",
    a: "15 a 20 minutes c'est suffisant. Un cours + des exercices. Meme si tu rentres tard du lycee, tu peux quand meme reviser.",
  },
  {
    q: "Mes parents peuvent voir mes notes ?",
    a: "Oui, y'a un espace parent. Ils creent leur compte, ils voient ta progression, tes efforts. C'est transparent.",
  },
  {
    q: "C'est quoi Prof Ada exactement ?",
    a: "C'est une intelligence artificielle qui te fait cours comme un vrai prof. Elle connait tout le programme BEPC et elle s'adapte a toi. C'est comme avoir un repetiteur disponible 24h/24.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#009E60]/10">
        <Check className="h-4 w-4 text-[#009E60]" />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100">
        <X className="h-4 w-4 text-stone-300" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
        <Check className="h-4 w-4 text-amber-500" />
      </span>
    );
  return <span className="text-xs font-bold text-stone-700">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-stone-200 bg-white px-6 py-4 font-bold text-stone-800 transition-all hover:border-[#F77F00]/40 group-open:rounded-b-none group-open:border-b-0 group-open:border-[#F77F00]/30 [&::-webkit-details-marker]:hidden">
        <span>{q}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-stone-400 transition-transform group-open:rotate-180 group-open:text-[#F77F00]" />
      </summary>
      <div className="rounded-b-2xl border-2 border-t-0 border-[#F77F00]/30 bg-white px-6 pb-5 pt-2">
        <p className="text-[15px] leading-relaxed text-stone-600">{a}</p>
      </div>
    </details>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFBF5] text-stone-900">
      {/* ── Tricolor top ────────────────────────────────────────── */}
      <TricolorBar />

      {/* ── Navigation ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#F77F00]/10 bg-[#FFFBF5]/92 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#F77F00] to-[#D97706] text-white shadow-md shadow-orange-300/30">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">Notria</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/connexion">
              <Button variant="ghost" className="hidden text-stone-600 hover:text-stone-900 sm:inline-flex">
                Connexion
              </Button>
            </Link>
            <Link href="/inscription">
              <Button className="rounded-full bg-gradient-to-r from-[#F77F00] to-[#D97706] px-6 text-white shadow-lg shadow-orange-300/30 hover:shadow-orange-300/50">
                Commencer <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* Background pattern — Baoulé-inspired diamonds */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23000' stroke-width='0.8'/%3E%3Ccircle cx='40' cy='40' r='6' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }} />
        {/* Warm blurs */}
        <div className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-[#F77F00]/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-40 h-[400px] w-[400px] rounded-full bg-[#009E60]/8 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-12 sm:pb-16 sm:pt-16">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left — Text */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-[#F77F00]/20 bg-[#F77F00]/5 px-4 py-2 text-sm font-bold text-[#B45309]">
                <span className="text-base">🇨🇮</span>
                Pour les eleves de 3eme en Cote d&apos;Ivoire
              </div>

              <h1 className="text-[2.6rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Ton BEPC,{" "}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-[#F77F00] to-[#D97706] bg-clip-text text-transparent">
                    tu vas le gerer.
                  </span>
                  <svg className="absolute -bottom-1 left-0 z-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
                    <path d="M0,5 Q50,0 100,5 T200,5" stroke="#F77F00" strokeWidth="3" fill="none" opacity="0.3" />
                  </svg>
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-500">
                Prof Ada c&apos;est ton repetiteur IA. 15 min par jour, elle te fait cours, elle te corrige, elle te fait progresser. Programme BEPC. Gratuit.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/inscription">
                  <Button className="h-13 rounded-full bg-gradient-to-r from-[#F77F00] to-[#D97706] px-8 text-base font-bold text-white shadow-xl shadow-orange-300/30 transition-all hover:shadow-orange-300/50 hover:brightness-110">
                    Commencer — c&apos;est gratuit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <span className="text-sm text-stone-400">0 FCFA &middot; Pas d&apos;appli a installer</span>
              </div>

              {/* Social proof */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#FFFBF5]">
                      <Image src={`/images/students/student-portrait-${n}.jpg`} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-stone-700">Rejoins les eleves qui revisent deja</p>
                  <p className="text-stone-400">Yopougon, Cocody, Bouake, Yamoussoukro...</p>
                </div>
              </div>
            </div>

            {/* Right — Illustration + Image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border-2 border-[#F77F00]/15 bg-white p-2 shadow-2xl shadow-orange-200/20">
                <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image src="/images/students/homepage-new.png" alt="Deux eleves souriants avec leurs cahiers" fill className="object-cover object-[center_15%]" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/70 via-transparent to-transparent" />
                  {/* Overlay card */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-xl bg-white/20 p-3 backdrop-blur-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F77F00] to-[#009E60] text-white">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Session en cours</p>
                      <p className="text-sm font-bold">Maths — Theoreme de Pythagore</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating books */}
              <div className="absolute -bottom-4 -right-4 hidden lg:block">
                <BookStackIllustration className="h-20 w-20 drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AfricanDivider className="mt-4" />

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════════════════════ */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Comment ca marche ?</h2>
            <p className="mt-2 text-stone-500">Trois etapes. Meme pas complique.</p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={i} className="group relative">
                {/* Connector arrow */}
                {i < 2 && (
                  <div className="pointer-events-none absolute -right-4 top-12 z-10 hidden text-[#F77F00]/50 sm:block">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
                <div className="relative overflow-hidden rounded-2xl border-2 border-stone-200 bg-[#FFFBF5] p-6 transition-all hover:border-[#F77F00]/30 hover:shadow-lg hover:shadow-orange-100/40">
                  {/* Step number */}
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F77F00] to-[#D97706] text-sm font-bold text-white shadow-md">
                      {step.n}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#F77F00]/20 to-transparent" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PROF ADA SECTION
          ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917]">
        {/* Pattern overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23FFF' stroke-width='0.6'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#F77F00]/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#009E60]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex justify-center">
              <ProfAdaIllustration className="h-56 w-56 drop-shadow-2xl sm:h-64 sm:w-64" />
            </div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F77F00]/10 px-4 py-1.5 text-sm font-bold text-[#F77F00]">
                <Sparkles className="h-4 w-4" /> Intelligence Artificielle
              </div>
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                Prof Ada,{" "}
                <span className="text-[#F77F00]">ta repetitrice perso</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-stone-400">
                Ada connait tout le programme BEPC de Cote d&apos;Ivoire. Tu lui poses tes questions, elle t&apos;explique comme une grande soeur patiente. Tu te trompes ? Elle re-explique autrement. Pas de jugement, pas de stress.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Disponible 24h/24, meme le dimanche soir",
                  "S'adapte a TON niveau, pas celui de toute la classe",
                  "Explique en francais simple et clair",
                  "Connait les pieges du BEPC",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-300">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#009E60]" />
                    <span className="text-[15px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SUBJECTS
          ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Les 5 matieres du BEPC</h2>
          <p className="mt-2 text-stone-500">Tout le programme officiel de 3eme en Cote d&apos;Ivoire. Pas de hors-sujet.</p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {subjects.map((s) => (
            <div key={s.name} className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all hover:shadow-md ${s.bg}`}>
              <span className="text-3xl">{s.emoji}</span>
              <p className="font-bold text-stone-800">{s.name}</p>
              <p className="text-xs text-stone-500">{s.full}</p>
            </div>
          ))}
        </div>
      </section>

      <AfricanDivider />

      {/* ══════════════════════════════════════════════════════════
          FEATURES
          ══════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tout ce qu&apos;il te faut pour reussir</h2>
            <p className="mt-2 text-stone-500">C&apos;est pas un simple chatbot. C&apos;est un vrai systeme de revision complet.</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="group rounded-2xl border-2 border-stone-200 bg-[#FFFBF5] p-6 transition-all hover:border-[#F77F00]/30 hover:shadow-lg hover:shadow-orange-100/30">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="mt-4 text-[17px] font-bold text-stone-800">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DEMO / CLASSROOM IMAGE
          ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="relative aspect-[3/2]">
              <Image src="/images/students/hero-students.jpg" alt="Eleves et professeur en classe" fill className="object-contain bg-stone-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/50 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm font-bold text-white/90">
                Un cours clair, des exercices, et tu comprends.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <div className="relative aspect-[3/2]">
              <Image src="/images/students/anotherpic.png" alt="Eleves souriants" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/50 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm font-bold text-white/90">
                Quand tu vois que tes notes montent, ca fait plaisir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          COMPARISON
          ══════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pourquoi Notria ?</h2>
            <p className="mt-2 text-stone-500">Compare toi-meme et tu vas voir.</p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border-2 border-stone-200 bg-[#FFFBF5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-white">
                  <th className="px-4 py-4 text-left font-medium text-stone-400 sm:px-6"></th>
                  <th className="px-3 py-4 text-center sm:px-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F77F00]/10 px-3 py-1 font-bold text-[#B45309]">
                      <GraduationCap className="h-4 w-4" /> Notria
                    </span>
                  </th>
                  <th className="px-3 py-4 text-center font-medium text-stone-400 sm:px-4">Repetiteur</th>
                  <th className="px-3 py-4 text-center font-medium text-stone-400 sm:px-4">Seul</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-[#FFFBF5]"}>
                    <td className="px-4 py-3 font-medium text-stone-700 sm:px-6">{row.label}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex justify-center"><ComparisonCell value={row.notria} /></div>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex justify-center"><ComparisonCell value={row.prof} /></div>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex justify-center"><ComparisonCell value={row.solo} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AfricanDivider />

      {/* ══════════════════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">C&apos;est combien ?</h2>
          <p className="mt-2 text-stone-500">Commence maintenant. Tu paies 0 franc.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {/* Free plan */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#009E60]/30 bg-white p-7">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#009E60]/5" />
            <p className="text-sm font-bold uppercase tracking-widest text-[#009E60]">Gratuit</p>
            <p className="mt-3 text-5xl font-bold text-stone-800">
              0 <span className="text-xl font-medium text-stone-400">FCFA</span>
            </p>
            <p className="mt-1 text-sm text-stone-500">Pendant toute la beta, zero franc</p>
            <ul className="mt-7 space-y-3 text-[15px] text-stone-700">
              {[
                "Prof Ada en illimite",
                "Cours complets avec exemples",
                "Exercices type BEPC",
                "Programme personnalise",
                "Suivi parent",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#009E60]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/inscription" className="mt-7 block">
              <Button className="w-full rounded-full bg-gradient-to-r from-[#009E60] to-[#047857] py-6 text-base font-bold text-white shadow-lg shadow-emerald-200/40 hover:shadow-emerald-200/60">
                Commencer maintenant
              </Button>
            </Link>
          </div>

          {/* Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#F77F00]/30 bg-white p-7">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#F77F00]/5" />
            <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#F77F00] to-[#D97706] px-3 py-1 text-xs font-bold text-white shadow-sm">
              Bientot
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#D97706]">Premium</p>
            <p className="mt-3 text-5xl font-bold text-stone-800">
              2 000 <span className="text-xl font-medium text-stone-400">FCFA/mois</span>
            </p>
            <p className="mt-1 text-sm text-stone-500">7 jours d&apos;essai gratuit</p>
            <ul className="mt-7 space-y-3 text-[15px] text-stone-700">
              {[
                "Tout du plan gratuit",
                "Exercices avances type examen",
                "Support prioritaire",
                "Certificat de progression",
                "Sessions illimitees",
              ].map((f, i) => (
                <li key={f} className="flex items-start gap-3">
                  {i === 0 ? (
                    <Star className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
                  ) : (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
                  )}
                  <span className={i === 0 ? "font-semibold" : ""}>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-7 w-full rounded-full py-6 text-base opacity-50" disabled>
              Bientot disponible
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
          ══════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ils revisent deja avec Notria</h2>
            <p className="mt-2 text-stone-500">Des eleves comme toi, de partout en Cote d&apos;Ivoire.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <article key={t.name} className="rounded-2xl border-2 border-stone-200 bg-[#FFFBF5] p-5 transition-all hover:border-[#F77F00]/20">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#F77F00]/20">
                    <Image src={t.img} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">{t.name}</p>
                    <p className="text-xs text-stone-400">{t.lieu}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-stone-600">
                  &laquo;{t.text}&raquo;
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <AfricanDivider />

      {/* ══════════════════════════════════════════════════════════
          FAQ
          ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tu te poses des questions ?</h2>
          <p className="mt-2 text-stone-500">On a les reponses.</p>
        </div>

        <div className="mt-10 space-y-3">
          {faq.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════════════════════ */}
      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23FFF' stroke-width='0.5'/%3E%3Ccircle cx='30' cy='30' r='5' fill='none' stroke='%23FFF' stroke-width='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }} />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#F77F00]/15 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#009E60]/10 blur-[80px]" />

          <div className="relative grid items-center gap-8 p-8 sm:grid-cols-5 sm:p-12">
            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl sm:col-span-2">
              <div className="relative aspect-[4/3]">
                <Image src="/images/students/focused-studying.jpg" alt="Eleve qui etudie" fill className="object-cover" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
              </div>
            </div>

            {/* Text */}
            <div className="text-white sm:col-span-3">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                Le BEPC c&apos;est bientot.
                <br />
                <span className="text-[#F77F00]">Faut pas attendre.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-stone-400">
                Inscription en 2 minutes. Tu commences ta premiere session directement. Prof Ada t&apos;attend.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/inscription">
                  <Button className="rounded-full bg-gradient-to-r from-[#F77F00] to-[#D97706] px-7 font-bold text-white shadow-xl shadow-orange-500/20 hover:brightness-110">
                    Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/connexion">
                  <Button variant="ghost" className="rounded-full border border-white/15 text-white hover:bg-white/10">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════ */}
      <TricolorBar />
      <footer className="bg-[#1C1917]">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#F77F00] to-[#D97706] text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-white">Notria</span>
            </div>
            <p className="text-center text-sm text-stone-500">
              🇨🇮 Fait avec coeur a Abidjan pour les eleves de Cote d&apos;Ivoire
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
