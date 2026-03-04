import OpenAI from "openai";
import { z } from "zod";
import { PromptRegistry, runJsonPrompt } from "../observability/prompt-registry.js";
import { PedagogicalContentService } from "./pedagogical-content.service.js";

type GuidedSessionState =
  | "INTRO"
  | "EXPLAIN"
  | "CHECK"
  | "PRACTICE"
  | "VALIDATE"
  | "NEXT_CONCEPT"
  | "RECAP";

type GuidedInteractionType = "choice" | "short_text" | "number" | "voice_or_text";
type GuidedVisualType = "formula" | "diagram" | "exercise_card";

interface GuidedChoiceOption {
  id: string;
  label: string;
}

interface GuidedStepVisual {
  type: GuidedVisualType;
  title?: string;
  content: string;
  figure?: "triangle" | "vector" | "repere" | "fraction" | "equation" | "method";
  labels?: Record<string, string>;
  steps?: string[];
}

interface GuidedStepInteraction {
  type: GuidedInteractionType;
  ctaLabel: string;
  placeholder?: string;
  choices?: GuidedChoiceOption[];
}

interface GuidedStep {
  id: string;
  state: GuidedSessionState;
  coachLines: string[];
  prompt: string;
  visual?: GuidedStepVisual;
  interaction: GuidedStepInteraction;
  feedback?: string;
}

interface GuidedSessionProgress {
  correctAnswers: number;
  totalChecks: number;
  completionPercent: number;
}

interface GuidedSessionStartResponse {
  sessionId: string;
  step: GuidedStep;
  progress: GuidedSessionProgress;
}

interface GuidedSessionRespondResponse {
  step: GuidedStep;
  progress: GuidedSessionProgress;
}

interface SessionContent {
  keyConcepts?: string[];
  exercises?: string[];
  ragSources?: string[];
}

interface GuidedSessionStartInput {
  topic?: string;
  title?: string;
  description?: string;
  type?: string;
  subject?: string;
  examType?: "BEPC" | "BAC";
  durationMinutes?: number;
  objectives?: string[];
  content?: SessionContent;
  courseProgramSessionId?: number;
}

type SessionStepId =
  | "intro-level"
  | "explain-context"
  | "concept-check"
  | "practice"
  | "recap-check"
  | "recap";

interface RespondPayload {
  choiceId?: string;
  response?: string | number;
}

interface GuidedScript {
  topic: string;
  title: string;
  introLine1: string;
  introLine2: string;
  contextLine1: string;
  contextLine2: string;
  contextLine3: string;
  checkLine1: string;
  checkLine2: string;
  checkPrompt: string;
  practiceLine1: string;
  practiceLine2: string;
  practicePrompt: string;
  recapLine1: string;
  explainVisual?: GuidedStepVisual;
  checkVisual?: GuidedStepVisual;
  practiceVisual?: GuidedStepVisual;
  recapVisual?: GuidedStepVisual;
}

interface GuidedSessionInstance {
  id: string;
  topic: string;
  subject: string;
  examType: "BEPC" | "BAC";
  officialContext: string;
  courseProgramSessionId?: number;
  script: GuidedScript;
  topicKeywords: string[];
  currentStepId: SessionStepId;
  correctAnswers: number;
  totalChecks: number;
}

interface OfficialContextMeta {
  subject: string;
  examType: "BEPC" | "BAC";
  officialContext: string;
}

interface GeneratedScriptResult {
  script: GuidedScript;
  officialMeta: OfficialContextMeta;
}

const sessions = new Map<string, GuidedSessionInstance>();
const FLOW_STEPS: SessionStepId[] = [
  "intro-level",
  "explain-context",
  "concept-check",
  "practice",
  "recap-check",
  "recap",
];

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

function normalizeInput(input?: GuidedSessionStartInput | string): GuidedSessionStartInput {
  if (!input) return { topic: "seance du jour" };
  if (typeof input === "string") return { topic: input };
  return input;
}

function inferSubjectFromText(value: string): string {
  const text = normalizeText(value);
  if (
    text.includes("francais") ||
    text.includes("grammaire") ||
    text.includes("conjugaison") ||
    text.includes("orthographe")
  ) return "Français";
  if (
    text.includes("anglais") ||
    text.includes("english") ||
    text.includes("grammar") ||
    text.includes("reading")
  ) return "Anglais";
  if (
    text.includes("svt") ||
    text.includes("cellule") ||
    text.includes("ecosysteme") ||
    text.includes("reproduction")
  ) return "SVT";
  if (
    text.includes("physique") ||
    text.includes("chimie") ||
    text.includes("electricite") ||
    text.includes("optique") ||
    text.includes("mecanique")
  ) return "Physique-Chimie";
  return "Mathématiques";
}

function truncateContext(value: string, maxChars = 2600): string {
  const text = value.trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[contexte officiel tronque]`;
}

async function resolveOfficialContext(params: {
  subjectHint?: string;
  examTypeHint?: "BEPC" | "BAC";
  textParts: string[];
}): Promise<OfficialContextMeta> {
  const examType: "BEPC" | "BAC" = params.examTypeHint === "BAC" ? "BAC" : "BEPC";
  const mergedText = params.textParts.filter(Boolean).join(" ");
  const subject = params.subjectHint?.trim() || inferSubjectFromText(mergedText);
  const officialContext = await PedagogicalContentService.getCurriculumContext(subject, examType);
  return { subject, examType, officialContext };
}

function fallbackScript(input: GuidedSessionStartInput): GuidedScript {
  const topic = input.topic?.trim() || "seance du jour";
  const title = input.title?.trim() || `Micro-session: ${topic}`;
  const objective = input.objectives?.[0] || `Comprendre les points cles de ${topic}`;
  const conceptHint = input.content?.keyConcepts?.[0] || "";
  const exerciseHint = input.content?.exercises?.[0] || "";
  const description = input.description?.trim() || "";

  const inferredVisualType = inferVisualType(topic, conceptHint || objective);

  // Build a concrete exercise if none provided
  const concreteExercise = exerciseHint && isConcreteExercise(exerciseHint)
    ? exerciseHint
    : getTopicExerciseTemplate(topic);

  // Build a concrete check question (not "explain in your own words")
  const concreteCheckPrompt = getTopicCheckQuestion(topic, conceptHint);

  return {
    topic,
    title,
    introLine1: `Salut ! Aujourd'hui on va travailler sur ${topic}.`,
    introLine2: `Objectif: ${objective}. On y va pas a pas, tu vas voir c'est simple.`,
    contextLine1: description
      ? `${description} C'est une notion importante pour le BEPC.`
      : `${objective}. C'est une notion cle du programme de 3eme.`,
    contextLine2: conceptHint
      ? `Voici comment ca marche: ${conceptHint}. Regarde l'exemple au tableau pour mieux comprendre.`
      : `On va voir la methode avec un exemple concret. Regarde bien les etapes au tableau.`,
    contextLine3: conceptHint
      ? `A retenir: ${conceptHint}.`
      : `A retenir: pour ${topic}, suis toujours les etapes dans l'ordre.`,
    checkLine1: "Maintenant, on verifie que tu as compris avec une petite question.",
    checkLine2: "Utilise ce qu'on vient de voir dans le cours.",
    checkPrompt: concreteCheckPrompt,
    practiceLine1: "A ton tour ! Voici un exercice a resoudre.",
    practiceLine2: "Rappelle-toi de la methode: lis l'enonce, applique la formule, verifie ton resultat.",
    practicePrompt: concreteExercise,
    recapLine1: `Bien joue ! Tu as travaille sur ${topic}. Continue comme ca.`,
    explainVisual: {
      type: inferredVisualType,
      title: topic,
      content: [
        objective,
        conceptHint || `Methode: etape par etape`,
      ].filter(Boolean).join("\n"),
      figure: inferredVisualType === "diagram" ? "triangle" : "method",
      steps: ["Comprendre la definition", "Voir l'exemple", "Retenir la formule"],
    },
    checkVisual: {
      type: "formula",
      title: "Verification",
      content: concreteCheckPrompt,
      figure: "method",
      steps: ["Lire la question", "Appliquer le cours", "Donner la reponse"],
    },
    practiceVisual: {
      type: "exercise_card",
      title: `Exercice: ${topic}`,
      content: concreteExercise,
      figure: "equation",
      steps: ["Lire l'enonce", "Appliquer la methode", "Verifier le resultat"],
    },
    recapVisual: {
      type: "formula",
      title: "Methode a retenir",
      content: [
        "1) Lire l'enonce et reperer les donnees",
        "2) Choisir et appliquer la bonne formule",
        "3) Calculer et verifier le resultat",
      ].join("\n"),
      figure: "method",
      steps: ["Lire", "Appliquer", "Verifier"],
    },
  };
}

function getTopicCheckQuestion(topic: string, conceptHint: string): string {
  const t = normalizeText(topic);

  // --- Mathematiques ---
  if (t.includes("pythagore")) return "Dans un triangle rectangle, AB=6cm et BC=8cm. Quelle est la formule pour trouver AC?";
  if (t.includes("thales")) return "Si deux droites paralleles coupent deux secantes, que peut-on dire des rapports des segments?";
  if (t.includes("vecteur")) return "Si A(1,3) et B(4,7), quelles sont les coordonnees du vecteur AB?";
  if (t.includes("equation")) return "Pour resoudre 2x+5=13, quelle est la premiere etape?";
  if (t.includes("fraction")) return "Comment simplifier la fraction 12/18? Donne le resultat.";
  if (t.includes("trigonometrie") || t.includes("cosinus") || t.includes("sinus"))
    return "Dans un triangle rectangle, cos(angle) = quoi divise par quoi?";
  if (t.includes("fonction") || t.includes("lineaire") || t.includes("affine"))
    return "Si f(x)=3x+2, combien vaut f(4)?";
  if (t.includes("statistique") || t.includes("moyenne"))
    return "Comment calcule-t-on la moyenne d'une serie de nombres?";
  if (t.includes("probabilite")) return "On lance un de a 6 faces. Quelle est la probabilite d'obtenir un 3?";
  if (t.includes("geometrie") || t.includes("cercle") || t.includes("aire"))
    return "Quelle est la formule de l'aire d'un cercle de rayon r?";

  // --- Physique-Chimie ---
  if (t.includes("electricite") || t.includes("circuit") || t.includes("tension"))
    return "Quelle est la formule de la loi d'Ohm? (relation entre U, R et I)";
  if (t.includes("mecanique") || t.includes("force") || t.includes("poids"))
    return "Quelle est la formule du poids? (P = ... x ...)";
  if (t.includes("optique") || t.includes("lumiere") || t.includes("lentille"))
    return "Dans quel milieu la lumiere se propage-t-elle en ligne droite?";
  if (t.includes("chimie") || t.includes("solution") || t.includes("matiere"))
    return "Quelle est la difference entre un melange homogene et un melange heterogene?";
  if (t.includes("energie"))
    return "Cite deux formes d'energie que tu connais.";

  // --- SVT ---
  if (t.includes("cellule"))
    return "Quels sont les 3 elements principaux d'une cellule? (membrane, ... , ...)";
  if (t.includes("reproduction"))
    return "Quel est le role des gametes dans la reproduction?";
  if (t.includes("nutrition") || t.includes("digestion") || t.includes("aliment"))
    return "Quel organe commence la digestion des aliments?";
  if (t.includes("environnement") || t.includes("ecosysteme") || t.includes("ecologie"))
    return "Qu'est-ce qu'un ecosysteme? Donne un exemple.";
  if (t.includes("corps humain") || t.includes("organe") || t.includes("respiration"))
    return "Quel gaz inspire-t-on et quel gaz expire-t-on lors de la respiration?";

  // --- Francais ---
  if (t.includes("grammaire") || t.includes("sujet") || t.includes("complement"))
    return "Dans la phrase 'Le chat mange la souris', quel est le sujet et quel est le COD?";
  if (t.includes("conjugaison") || t.includes("verbe") || t.includes("temps"))
    return "Conjugue le verbe 'aller' au passe compose avec 'je'.";
  if (t.includes("orthographe") || t.includes("dictee"))
    return "Ecris correctement: 'Les enfants (jouer) dans la cour.' Quel temps utilises-tu?";
  if (t.includes("expression") || t.includes("redaction") || t.includes("texte"))
    return "Quelle est la difference entre un texte narratif et un texte argumentatif?";
  if (t.includes("comprehension") || t.includes("lecture"))
    return "Quand tu lis un texte, que dois-tu reperer en premier pour le comprendre?";
  if (t.includes("vocabulaire"))
    return "Quel est le synonyme du mot 'heureux'?";
  if (t.includes("resume"))
    return "Quelles sont les 3 regles principales pour faire un bon resume?";

  // --- Anglais ---
  if (t.includes("grammar") || t.includes("tense") || t.includes("verb"))
    return "Complete: 'She ___ (go) to school every day.' (present simple)";
  if (t.includes("reading") || t.includes("comprehension"))
    return "When reading a text in English, what should you look for first?";
  if (t.includes("vocabulary") || t.includes("word"))
    return "What is the opposite of 'happy'?";
  if (t.includes("writing") || t.includes("paragraph"))
    return "What are the 3 parts of a good paragraph? (introduction, ..., ...)";
  if (t.includes("english") || t.includes("anglais") || t.includes("everyday"))
    return "How do you introduce yourself in English? Write one sentence.";

  // --- Fallback generique ---
  if (conceptHint) return `D'apres le cours, ${conceptHint.toLowerCase().replace(/\.$/, "")} — donne un exemple concret.`;
  return `Quelle est la notion principale a retenir pour ${topic}?`;
}

function inferVisualType(topic: string, context: string): GuidedVisualType {
  const text = `${topic} ${context}`.toLowerCase();
  if (
    text.includes("triangle") ||
    text.includes("pythagore") ||
    text.includes("geometr") ||
    text.includes("schema") ||
    text.includes("repere") ||
    text.includes("circuit") ||
    text.includes("cellule") ||
    text.includes("organe") ||
    text.includes("ecosysteme") ||
    text.includes("optique")
  ) {
    return "diagram";
  }
  if (
    text.includes("exercice") ||
    text.includes("probleme") ||
    text.includes("application") ||
    text.includes("texte") ||
    text.includes("comprehension") ||
    text.includes("reading") ||
    text.includes("writing") ||
    text.includes("dictee") ||
    text.includes("redaction")
  ) {
    return "exercise_card";
  }
  return "formula";
}

function sanitizeVisual(
  value: unknown,
  fallback: GuidedStepVisual,
): GuidedStepVisual {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<GuidedStepVisual>;
  const type =
    candidate.type === "formula" || candidate.type === "diagram" || candidate.type === "exercise_card"
      ? candidate.type
      : fallback.type;
  const title =
    typeof candidate.title === "string" && candidate.title.trim().length > 0
      ? candidate.title.trim()
      : fallback.title;
  const content =
    typeof candidate.content === "string" && candidate.content.trim().length > 0
      ? candidate.content.trim()
      : fallback.content;
  const figure =
    candidate.figure === "triangle" ||
    candidate.figure === "vector" ||
    candidate.figure === "repere" ||
    candidate.figure === "fraction" ||
    candidate.figure === "equation" ||
    candidate.figure === "method"
      ? candidate.figure
      : fallback.figure;
  const labels =
    candidate.labels && typeof candidate.labels === "object"
      ? candidate.labels as Record<string, string>
      : fallback.labels;
  const steps = Array.isArray(candidate.steps)
    ? candidate.steps.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6)
    : fallback.steps;

  return {
    type,
    title,
    content,
    figure,
    labels,
    steps,
  };
}

function extractCoreTokens(value: string): string[] {
  const normalized = normalizeText(value).replace(/[^a-z0-9\s]/g, " ");
  return Array.from(
    new Set(
      normalized
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4),
    ),
  );
}

function overlapCount(a: string, b: string): number {
  const aTokens = new Set(extractCoreTokens(a));
  const bTokens = extractCoreTokens(b);
  return bTokens.filter((token) => aTokens.has(token)).length;
}

function isConcreteExercise(value: string): boolean {
  return /[0-9=+\-*/()]/.test(value) || /\b(calcule|resous|determine|trouve|montre|conjugue|analyse|complete|corrige|explique|ecris|cite|place|identifie|write|read|put|match|answer)\b/i.test(value);
}

function getTopicExerciseTemplate(topic: string): string {
  const t = normalizeText(topic);

  // --- Mathematiques ---
  if (t.includes("vecteur"))
    return "Dans un repere, A(1,2) et B(5,4). Calcule les coordonnees du vecteur AB puis sa norme.";
  if (t.includes("pythagore"))
    return "Triangle rectangle en B, AB=3 cm et BC=4 cm. Calcule AC en montrant les etapes.";
  if (t.includes("equation"))
    return "Resous: 2x + 5 = 17. Donne les etapes puis la valeur de x.";
  if (t.includes("thales"))
    return "Dans un triangle ABC, M est sur [AB] et N sur [AC] avec (MN)//(BC). AM=3, AB=9, AN=2. Calcule AC.";
  if (t.includes("trigonometrie") || t.includes("cosinus") || t.includes("sinus"))
    return "Triangle rectangle en A, angle B=30 degres, BC=10cm. Calcule AB en utilisant cos(B).";
  if (t.includes("fonction") || t.includes("lineaire") || t.includes("affine"))
    return "f(x) = 2x - 3. Calcule f(0), f(1) et f(5). Puis trace la droite sur un repere.";
  if (t.includes("statistique") || t.includes("moyenne"))
    return "Notes d'un eleve: 12, 14, 8, 16, 10. Calcule la moyenne. Quelle est la note la plus frequente?";

  // --- Physique-Chimie ---
  if (t.includes("electricite") || t.includes("circuit") || t.includes("tension"))
    return "Un appareil a une resistance R=20 ohms et est traverse par un courant I=0,5A. Calcule la tension U avec la loi d'Ohm.";
  if (t.includes("mecanique") || t.includes("force") || t.includes("poids"))
    return "Un objet a une masse m=5kg. Calcule son poids P sachant que g=10N/kg.";
  if (t.includes("optique") || t.includes("lumiere"))
    return "Un rayon lumineux passe de l'air a l'eau. Que se passe-t-il au niveau de la surface? Explique le phenomene.";
  if (t.includes("chimie") || t.includes("solution") || t.includes("matiere"))
    return "On dissout 10g de sel dans 200mL d'eau. Calcule la concentration massique de la solution en g/L.";
  if (t.includes("energie"))
    return "Une lampe de 60W fonctionne pendant 2 heures. Calcule l'energie consommee en Wh puis en kWh.";

  // --- SVT ---
  if (t.includes("cellule"))
    return "Dessine une cellule animale et nomme ses 3 parties principales. Quel est le role du noyau?";
  if (t.includes("reproduction"))
    return "Explique la difference entre la fecondation interne et la fecondation externe. Donne un exemple pour chaque.";
  if (t.includes("nutrition") || t.includes("digestion"))
    return "Place dans l'ordre les organes du tube digestif: estomac, bouche, intestin grele, oesophage, gros intestin.";
  if (t.includes("environnement") || t.includes("ecosysteme"))
    return "Dans une foret, cite un producteur, un consommateur primaire et un consommateur secondaire. Trace la chaine alimentaire.";
  if (t.includes("corps humain") || t.includes("respiration"))
    return "Explique le trajet de l'air depuis le nez jusqu'aux poumons. Cite 3 organes traverses.";

  // --- Francais ---
  if (t.includes("grammaire") || t.includes("complement"))
    return "Analyse la phrase: 'Le professeur donne un livre a l'eleve.' Identifie le sujet, le verbe, le COD et le COI.";
  if (t.includes("conjugaison") || t.includes("verbe"))
    return "Conjugue les verbes 'finir' et 'prendre' au passe compose avec le sujet 'nous'.";
  if (t.includes("orthographe") || t.includes("dictee"))
    return "Corrige les erreurs: 'Les enfant joue dans la cours de l'ecoles.' Reecris la phrase correctement.";
  if (t.includes("expression") || t.includes("redaction"))
    return "Ecris 3 phrases pour decrire ta journee a l'ecole. Utilise le passe compose.";
  if (t.includes("comprehension") || t.includes("resume") || t.includes("texte"))
    return "Lis ce passage et reponds: 'L'eau est essentielle a la vie.' Pourquoi dit-on que l'eau est essentielle? Donne 2 raisons.";
  if (t.includes("vocabulaire"))
    return "Trouve un synonyme et un antonyme pour chaque mot: grand, rapide, joyeux.";

  // --- Anglais ---
  if (t.includes("grammar") || t.includes("tense"))
    return "Put the verbs in the correct form: 'Yesterday, she ___ (go) to school. Right now, she ___ (study).'";
  if (t.includes("reading") || t.includes("comprehension"))
    return "Read: 'Abidjan is the largest city in Ivory Coast.' Answer: What is the largest city? In which country is it?";
  if (t.includes("vocabulary") || t.includes("word"))
    return "Match the words with their French translation: happy, school, teacher, book.";
  if (t.includes("writing") || t.includes("paragraph"))
    return "Write 3 sentences about your family in English. Use: 'My name is...', 'I have...', 'We live in...'";
  if (t.includes("english") || t.includes("anglais") || t.includes("everyday"))
    return "Complete the dialogue: 'Hello, my name is ___. I am ___ years old. I live in ___.'";

  // --- Fallback generique ---
  return `Exercice sur ${topic}: reponds a la question principale du cours. Montre que tu as compris la notion.`;
}

function ensureCoherentScript(base: GuidedScript, fallback: GuidedScript): GuidedScript {
  const contextAnchor = [base.topic, base.contextLine1, base.contextLine2, base.contextLine3].join(" ");
  const coherentPracticePrompt = isConcreteExercise(base.practicePrompt)
    ? base.practicePrompt
    : getTopicExerciseTemplate(base.topic);

  const explainVisual = sanitizeVisual(base.explainVisual, fallback.explainVisual!);
  const checkVisual = sanitizeVisual(base.checkVisual, fallback.checkVisual!);
  const practiceVisual = sanitizeVisual(base.practiceVisual, fallback.practiceVisual!);
  const recapVisual = sanitizeVisual(base.recapVisual, fallback.recapVisual!);

  const explainVisualFixed =
    overlapCount(contextAnchor, explainVisual.content) >= 1
      ? explainVisual
      : fallback.explainVisual!;

  const checkVisualFixed =
    overlapCount([base.topic, base.checkPrompt].join(" "), checkVisual.content) >= 1
      ? checkVisual
      : fallback.checkVisual!;

  const practiceVisualContent =
    overlapCount([base.topic, coherentPracticePrompt].join(" "), practiceVisual.content) >= 1
      ? practiceVisual.content
      : coherentPracticePrompt;

  return {
    ...base,
    practicePrompt: coherentPracticePrompt,
    explainVisual: explainVisualFixed,
    checkVisual: checkVisualFixed,
    practiceVisual: {
      ...practiceVisual,
      content: practiceVisualContent,
    },
    recapVisual,
  };
}

function sanitizeScript(candidate: Partial<GuidedScript>, input: GuidedSessionStartInput): GuidedScript {
  const fallback = fallbackScript(input);
  const pick = (value: unknown, backup: string) =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : backup;

  const base: GuidedScript = {
    topic: pick(candidate.topic, fallback.topic),
    title: pick(candidate.title, fallback.title),
    introLine1: pick(candidate.introLine1, fallback.introLine1),
    introLine2: pick(candidate.introLine2, fallback.introLine2),
    contextLine1: pick(candidate.contextLine1, fallback.contextLine1),
    contextLine2: pick(candidate.contextLine2, fallback.contextLine2),
    contextLine3: pick(candidate.contextLine3, fallback.contextLine3),
    checkLine1: pick(candidate.checkLine1, fallback.checkLine1),
    checkLine2: pick(candidate.checkLine2, fallback.checkLine2),
    checkPrompt: pick(candidate.checkPrompt, fallback.checkPrompt),
    practiceLine1: pick(candidate.practiceLine1, fallback.practiceLine1),
    practiceLine2: pick(candidate.practiceLine2, fallback.practiceLine2),
    practicePrompt: pick(candidate.practicePrompt, fallback.practicePrompt),
    recapLine1: pick(candidate.recapLine1, fallback.recapLine1),
    explainVisual: sanitizeVisual(candidate.explainVisual, fallback.explainVisual!),
    checkVisual: sanitizeVisual(candidate.checkVisual, fallback.checkVisual!),
    practiceVisual: sanitizeVisual(candidate.practiceVisual, fallback.practiceVisual!),
    recapVisual: sanitizeVisual(candidate.recapVisual, fallback.recapVisual!),
  };

  return ensureCoherentScript(base, fallback);
}

async function generateScript(input: GuidedSessionStartInput): Promise<GeneratedScriptResult> {
  const client = getOpenAIClient();
  const topic = input.topic?.trim() || "seance du jour";
  const title = input.title?.trim() || "";
  const description = input.description?.trim() || "";
  const type = input.type?.trim() || "";
  const durationMinutes = Number.isFinite(input.durationMinutes) ? input.durationMinutes : undefined;
  const objectives = (input.objectives ?? []).slice(0, 3).join(" | ");
  const keyConcepts = (input.content?.keyConcepts ?? []).slice(0, 3).join(" | ");
  const exercises = (input.content?.exercises ?? []).slice(0, 2).join(" | ");
  const officialMeta = await resolveOfficialContext({
    subjectHint: input.subject,
    examTypeHint: input.examType,
    textParts: [topic, title, description, objectives, keyConcepts, exercises],
  });

  if (!client) return { script: fallbackScript(input), officialMeta };

  const scriptSchema = z.object({
    topic: z.string().min(1),
    title: z.string().min(1),
    introLine1: z.string().min(1),
    introLine2: z.string().min(1),
    contextLine1: z.string().min(1),
    contextLine2: z.string().min(1),
    contextLine3: z.string().min(1),
    checkLine1: z.string().min(1),
    checkLine2: z.string().min(1),
    checkPrompt: z.string().min(1),
    practiceLine1: z.string().min(1),
    practiceLine2: z.string().min(1),
    practicePrompt: z.string().min(1),
    recapLine1: z.string().min(1),
    explainVisual: z.any().optional(),
    checkVisual: z.any().optional(),
    practiceVisual: z.any().optional(),
    recapVisual: z.any().optional(),
  }).partial();

  try {
    const userContent = [
      `MICRO-COURS sur "${topic}" pour un eleve de 3eme en Cote d'Ivoire.`,
      `Matiere: ${officialMeta.subject}. Examen: ${officialMeta.examType}.`,
      title ? `Titre: ${title}.` : "",
      description ? `Description: ${description}.` : "",
      objectives ? `Objectifs: ${objectives}.` : "",
      keyConcepts ? `Concepts cles: ${keyConcepts}.` : "",
      exercises ? `Exercices de reference: ${exercises}.` : "",
      "",
      "REFERENTIEL OFFICIEL A RESPECTER (DPFC):",
      truncateContext(officialMeta.officialContext),
      "",
      "GENERE un JSON avec ces champs (chaque champ = une phrase que Prof Ada dit a l'eleve):",
      "",
      "introLine1: phrase d'accueil chaleureuse mentionnant le sujet du jour",
      "introLine2: ce qu'on va apprendre aujourd'hui (objectif clair)",
      "",
      "contextLine1: DEFINITION claire du concept. 2-3 phrases simples. Explique QUOI c'est et A QUOI ca sert. Comme si tu parlais a un eleve qui ne connait rien du sujet.",
      "contextLine2: EXEMPLE CONCRET resolu etape par etape avec des vrais chiffres. Montre la methode sur un cas simple. Ex: 'Prenons un triangle avec AB=3cm et BC=4cm. On cherche AC. Etape 1: on ecrit la formule AC²=AB²+BC². Etape 2: AC²=9+16=25. Etape 3: AC=5cm.'",
      "contextLine3: LA REGLE A RETENIR en une phrase. La formule ou la methode cle que l'eleve doit memoriser.",
      "",
      "checkLine1: phrase de transition vers la verification (ex: 'Voyons si tu as compris.')",
      "checkLine2: indice ou rappel pour aider l'eleve a repondre",
      "checkPrompt: UNE QUESTION PRECISE avec une reponse attendue claire. PAS 'explique avec tes mots'. Donne un petit calcul ou une question directe. Ex: 'Si AB=5 et BC=12, combien vaut AC?' ou 'Quelle est la formule du theoreme de Pythagore?'",
      "",
      "practiceLine1: introduction a l'exercice pratique",
      "practiceLine2: rappel de la methode a utiliser",
      "practicePrompt: UN EXERCICE avec des CHIFFRES CONCRETS. L'eleve doit pouvoir calculer. Ex: 'Resous: 3x + 7 = 22. Donne les etapes et le resultat.'",
      "",
      "recapLine1: felicitations et resume de ce qu'on a appris",
      "",
      "JSON strict. Pas de markdown. Pas de texte hors JSON.",
    ].filter(Boolean).join("\n");

    const { data } = await runJsonPrompt({
      prompt: PromptRegistry.guidedScriptV1,
      schema: scriptSchema,
      userContent,
      retries: 3,
      temperature: 0.5,
      maxTokens: 1200,
    });

    return {
      script: sanitizeScript(data as Partial<GuidedScript>, input),
      officialMeta,
    };
  } catch {
    return { script: fallbackScript(input), officialMeta };
  }
}

async function generateHelpResponse(
  session: GuidedSessionInstance,
  helpType: string,
  questionText?: string,
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) return fallbackHelpResponse(helpType, session);

  const stepContext = (() => {
    switch (session.currentStepId) {
      case "explain-context":
        return `Explication en cours: "${session.script.contextLine1}" / "${session.script.contextLine2}" / "${session.script.contextLine3}"`;
      case "concept-check":
        return `Verification: "${session.script.checkPrompt}"`;
      case "practice":
        return `Exercice: "${session.script.practicePrompt}"`;
      case "recap-check":
        return `Recap: methode sur "${session.topic}"`;
      default:
        return `Sujet: ${session.topic}`;
    }
  })();

  const systemPrompt = [
    "Tu es Prof Ada, tutrice bienveillante pour des eleves de 3eme (14-16 ans) en Cote d'Ivoire.",
    "Tu tutoies toujours. Ton ton est chaleureux et respectueux.",
    "REGLES STRICTES:",
    "- Francais TRES simple. Comme si tu parlais a un eleve de 14 ans.",
    "- Phrases courtes (max 15 mots par phrase).",
    "- PAS de metaphores compliquees. PAS de comparaisons abstraites.",
    "- Donne des EXEMPLES CONCRETS avec des chiffres.",
    "- Si c'est un calcul, montre les etapes: Etape 1, Etape 2, etc.",
    `Matiere: ${session.subject}. Examen: ${session.examType}.`,
    "Referentiel officiel DPFC (a respecter):",
    truncateContext(session.officialContext, 1800),
    `Sujet du cours: ${session.topic}.`,
    `Contenu du cours: ${session.script.contextLine1} ${session.script.contextLine2} ${session.script.contextLine3}`,
    stepContext,
  ].join("\n");

  const userPrompts: Record<string, string> = {
    not_understood: [
      "L'eleve n'a pas compris. Re-explique le cours plus simplement.",
      "1) Donne la DEFINITION en une phrase simple.",
      "2) Montre UN exemple avec des vrais chiffres, etape par etape.",
      "3) Termine par la regle a retenir.",
      "PAS de metaphore. PAS d'analogie. Juste le cours explique simplement.",
      "Maximum 4 phrases.",
    ].join(" "),
    need_example: [
      `Donne UN exemple concret sur "${session.topic}" avec des chiffres.`,
      "Montre chaque etape du calcul. Ex: 'Etape 1: on ecrit... Etape 2: on calcule...'",
      "L'eleve de 3eme doit pouvoir suivre sans aide.",
      "Maximum 4 phrases.",
    ].join(" "),
    need_hint: [
      `L'eleve est bloque sur cet exercice: "${session.script.practicePrompt}".`,
      "Donne la PREMIERE etape a faire, sans donner la reponse finale.",
      "Ex: 'Commence par ecrire la formule...' ou 'D'abord, identifie les donnees...'",
      "Maximum 2 phrases.",
    ].join(" "),
    ask_question: [
      `L'eleve pose cette question: "${questionText || ""}".`,
      "Reponds en rapport avec le cours sur ${session.topic}.",
      "Reponse directe et simple. Maximum 3 phrases.",
    ].join(" "),
  };

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      max_tokens: 250,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompts[helpType] || userPrompts.not_understood },
      ],
    });
    const response = completion.choices[0]?.message?.content?.trim();
    return response || fallbackHelpResponse(helpType, session);
  } catch {
    return fallbackHelpResponse(helpType, session);
  }
}

function fallbackHelpResponse(helpType: string, session: GuidedSessionInstance): string {
  switch (helpType) {
    case "not_understood":
      return `Pas de souci, on reprend calmement. Pour ${session.topic}, avance etape par etape et concentre-toi sur l'idee principale.`;
    case "need_example":
      return `Ok, imagine un exemple simple sur ${session.topic}. Commence par regarder ce que tu connais deja, et on avance a partir de la.`;
    case "need_hint":
      return "Petit indice: relis bien l'enonce, puis repere les donnees utiles avant de calculer.";
    case "ask_question":
      return `Bonne question. Pour ${session.topic}, garde une methode claire: lire, choisir la bonne regle, puis verifier.`;
    default:
      return "Dis-moi precisement ce qui te bloque et on corrige ensemble.";
  }
}

interface AnswerEvaluation {
  correct: boolean;
  feedback: string;
}

async function evaluateAnswer(
  session: GuidedSessionInstance,
  answer: string,
  stepType: "check" | "practice" | "recap",
): Promise<AnswerEvaluation> {
  const client = getOpenAIClient();
  if (!client) return fallbackEvaluation(session, answer, stepType);

  const questionContext = (() => {
    switch (stepType) {
      case "check":
        return `Question posee: "${session.script.checkPrompt}"`;
      case "practice":
        return `Exercice: "${session.script.practicePrompt}"`;
      case "recap":
        return `Question recap: "C'est quoi la methode pour ce type d'exercice ?"`;
    }
  })();

  const systemPrompt = [
    "Tu es Prof Ada, un tuteur ivoirien pour des eleves de 3eme en Cote d'Ivoire.",
    "Ton: encourageant, precis, pedagogique. Pas de style familier excessif.",
    "Francais clair, phrases courtes.",
    `Matiere: ${session.subject}. Examen: ${session.examType}.`,
    "Referentiel officiel DPFC (a respecter):",
    truncateContext(session.officialContext, 1800),
    `Sujet du cours: ${session.topic}.`,
    `Contenu du cours: ${session.script.contextLine1} ${session.script.contextLine2} ${session.script.contextLine3}`,
    questionContext,
  ].join("\n");

  const userPrompt = [
    `L'eleve a repondu: "${answer}"`,
    "",
    "Evalue cette reponse et reponds en JSON strict avec ces 2 champs:",
    '- "correct": true si la reponse montre une comprehension acceptable (meme imparfaite), false sinon',
    '- "feedback": ton retour personnalise SUR SA REPONSE (2-3 phrases max). Dis ce qui est bien, ce qui manque, ou corrige si c\'est faux. Sois specifique, pas generique.',
    "",
    "Exemples de bon feedback:",
    '- Si correct: "Oui c\'est ca ! Tu as bien vu que [detail specifique]. On continue !"',
    '- Si pas assez: "Tu es sur la bonne piste avec [ce qu\'il a dit]. Mais il manque [detail]. Essaie encore."',
    '- Si faux: "Pas tout a fait. Tu as dit [son erreur], mais en fait [correction]. Reflechis et reessaie."',
    '- Si hors sujet: "Ce n\'est pas encore dans le sujet. Relis la question et essaie avec la methode du cours."',
  ].join("\n");

  const evalSchema = z.object({
    correct: z.boolean(),
    feedback: z.string().min(1),
  });

  try {
    const { data } = await runJsonPrompt({
      prompt: PromptRegistry.guidedEvalV1,
      schema: evalSchema,
      userContent: `${systemPrompt}\n\n${userPrompt}`,
      retries: 2,
      temperature: 0.3,
      maxTokens: 260,
    });

    return { correct: data.correct, feedback: data.feedback };
  } catch {
    return fallbackEvaluation(session, answer, stepType);
  }
}

function fallbackEvaluation(
  session: GuidedSessionInstance,
  answer: string,
  stepType: "check" | "practice" | "recap",
): AnswerEvaluation {
  const keywordMatches = countKeywordMatches(answer, session.topicKeywords);
  const minLen = stepType === "check" ? 18 : 12;
  const strong = isStrongTextAnswer(answer, minLen);
  const math = hasMathSignals(answer);
  const correct = strong && (keywordMatches >= 1 || (stepType === "practice" && math));

  if (isConfusedAnswer(answer)) {
    return { correct: false, feedback: "Ce n'est pas grave. Essaie une premiere reponse avec tes mots, puis on corrige ensemble." };
  }
  if (correct) {
    return { correct: true, feedback: `Bonne reponse. Tu as bien compris l'idee sur ${session.topic}. On continue.` };
  }
  return { correct: false, feedback: "Ce n'est pas encore suffisant. Ajoute au moins une notion du cours dans ta reponse." };
}

function buildChoices(choices: Array<{ id: string; label: string }>): GuidedChoiceOption[] {
  return choices.map((choice) => ({ id: choice.id, label: choice.label }));
}

function buildProgress(session: GuidedSessionInstance): GuidedSessionProgress {
  const currentIndex = FLOW_STEPS.findIndex((stepId) => stepId === session.currentStepId);
  const completionPercent = Math.max(
    0,
    Math.min(100, Math.round((currentIndex / (FLOW_STEPS.length - 1)) * 100)),
  );

  return {
    correctAnswers: session.correctAnswers,
    totalChecks: session.totalChecks,
    completionPercent,
  };
}

function normalizeText(value: string | number | undefined): string {
  if (value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const STOP_WORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "ou", "a", "au", "aux",
  "en", "sur", "pour", "dans", "avec", "par", "est", "sont", "que", "qui", "quoi",
  "comment", "pourquoi", "quand", "ses", "son", "sa", "ce", "cet", "cette", "ces",
  "mon", "ma", "mes", "ton", "ta", "tes", "notre", "vos", "leur", "leurs", "on",
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "pas", "plus", "tres",
  "bien", "meme", "donc", "alors", "car", "comme", "fait", "faire", "fais", "etre",
]);

function extractKeywords(value: string | undefined): string[] {
  if (!value) return [];
  const normalized = normalizeText(value).replace(/[^a-z0-9\s]/g, " ");
  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
  return Array.from(new Set(tokens));
}

function buildTopicKeywords(input: GuidedSessionStartInput, script: GuidedScript): string[] {
  const seed = [
    input.topic,
    input.title,
    input.description,
    script.topic,
    script.title,
    script.checkPrompt,
    script.practicePrompt,
    ...(input.objectives ?? []),
    ...(input.content?.keyConcepts ?? []),
  ];
  return Array.from(new Set(seed.flatMap((value) => extractKeywords(value)))).slice(0, 20);
}

function isConfusedAnswer(value: string | number | undefined): boolean {
  const text = normalizeText(value);
  if (!text) return true;
  const confusionPatterns = [
    "je comprends rien",
    "je comprend rien",
    "je ne comprends pas",
    "je comprend pas",
    "je sais pas",
    "j sais pas",
    "aucune idee",
    "pas compris",
    "aide moi",
    "??",
  ];
  return confusionPatterns.some((pattern) => text.includes(pattern));
}

function countKeywordMatches(value: string | number | undefined, keywords: string[]): number {
  const text = normalizeText(value);
  if (!text || keywords.length === 0) return 0;
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function hasMathSignals(value: string | number | undefined): boolean {
  const raw = String(value ?? "");
  return /[0-9=+\-*/xy()]/i.test(raw);
}

function isStrongTextAnswer(value: string | number | undefined, minLength: number): boolean {
  const normalized = normalizeText(value);
  return normalized.length >= minLength;
}

function buildStep(session: GuidedSessionInstance, feedback?: string): GuidedStep {
  const base = { feedback };
  const { script } = session;

  switch (session.currentStepId) {
    case "intro-level":
      return {
        ...base,
        id: "intro-level",
        state: "INTRO",
        coachLines: [script.introLine1, script.introLine2],
        prompt: "Choisis ton point de depart.",
        interaction: {
          type: "choice",
          ctaLabel: "Choisir",
          choices: buildChoices([
            { id: "not-at-all", label: "Pas du tout" },
            { id: "a-bit", label: "Un peu" },
            { id: "confident", label: "Je suis a l'aise" },
          ]),
        },
      };
    case "explain-context":
      return {
        ...base,
        id: "explain-context",
        state: "EXPLAIN",
        coachLines: [script.contextLine1, script.contextLine2, script.contextLine3],
        prompt: "Lis bien le cours, regarde l'exemple, puis clique sur Continuer quand tu es pret.",
        visual: script.explainVisual,
        interaction: {
          type: "choice",
          ctaLabel: "J'ai compris, on continue",
          choices: buildChoices([
            { id: "understood_continue", label: "J'ai compris, on continue" },
          ]),
        },
      };
    case "concept-check":
      return {
        ...base,
        id: "concept-check",
        state: "CHECK",
        coachLines: [script.checkLine1, script.checkLine2],
        prompt: script.checkPrompt,
        visual: script.checkVisual,
        interaction: {
          type: "short_text",
          ctaLabel: "Valider",
          placeholder: "Dis avec tes mots...",
        },
      };
    case "recap-check":
      return {
        ...base,
        id: "recap-check",
        state: "CHECK",
        coachLines: [
          "Avant de finir, petit recap rapide !",
          `A retenir: ${script.contextLine1}`,
        ],
        prompt: "En une phrase: c'est quoi la methode pour ce type d'exercice ?",
        visual: script.recapVisual,
        interaction: {
          type: "short_text",
          ctaLabel: "Valider le recap",
          placeholder: "Ex: D'abord je fais..., puis je...",
        },
      };
    case "practice":
      return {
        ...base,
        id: "practice",
        state: "PRACTICE",
        coachLines: [script.practiceLine1, script.practiceLine2],
        prompt: "A toi de jouer !",
        visual: sanitizeVisual(script.practiceVisual, {
          type: "exercise_card",
          title: script.title,
          content: script.practicePrompt,
        }),
        interaction: {
          type: "short_text",
          ctaLabel: "Valider ma reponse",
          placeholder: "Methode + resultat",
        },
      };
    case "recap":
      return {
        ...base,
        id: "recap",
        state: "RECAP",
        coachLines: [
          script.recapLine1,
          `Ton score: ${session.correctAnswers}/${session.totalChecks}.`,
        ],
        prompt: "Tu veux terminer ou refaire un exercice ?",
        interaction: {
          type: "choice",
          ctaLabel: "Choisir",
          choices: buildChoices([
            { id: "finish", label: "Terminer" },
            { id: "restart", label: "Encore 1 exercice" },
          ]),
        },
      };
    default:
      return {
        ...base,
        id: "intro-level",
        state: "INTRO",
        coachLines: ["On relance la session."],
        prompt: "Clique pour recommencer.",
        interaction: {
          type: "choice",
          ctaLabel: "Relancer",
          choices: buildChoices([{ id: "restart", label: "Relancer" }]),
        },
      };
  }
}

function ensureSession(sessionId: string): GuidedSessionInstance {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }
  return session;
}

export const GuidedSessionService = {
  async start(input?: GuidedSessionStartInput | string): Promise<GuidedSessionStartResponse> {
    const normalizedInput = normalizeInput(input);
    const id = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    const { script, officialMeta } = await generateScript(normalizedInput);
    const topicKeywords = buildTopicKeywords(normalizedInput, script);

    const session: GuidedSessionInstance = {
      id,
      topic: script.topic,
      subject: officialMeta.subject,
      examType: officialMeta.examType,
      officialContext: officialMeta.officialContext,
      courseProgramSessionId: normalizedInput.courseProgramSessionId,
      script,
      topicKeywords,
      currentStepId: "intro-level",
      correctAnswers: 0,
      totalChecks: 0,
    };
    sessions.set(id, session);

    return {
      sessionId: id,
      step: buildStep(session),
      progress: buildProgress(session),
    };
  },

  getCurrent(sessionId: string): GuidedSessionRespondResponse {
    const session = ensureSession(sessionId);
    return {
      step: buildStep(session),
      progress: buildProgress(session),
    };
  },

  getSessionContext(sessionId: string): { courseProgramSessionId?: number } {
    const session = ensureSession(sessionId);
    return {
      courseProgramSessionId: session.courseProgramSessionId,
    };
  },

  canComplete(sessionId: string): boolean {
    const session = ensureSession(sessionId);
    return session.currentStepId === "recap";
  },

  close(sessionId: string) {
    ensureSession(sessionId);
    sessions.delete(sessionId);
  },

  async respond(sessionId: string, payload: RespondPayload): Promise<GuidedSessionRespondResponse> {
    const session = ensureSession(sessionId);
    let feedback: string | undefined;
    const keywordMatches = countKeywordMatches(payload.response, session.topicKeywords);
    const askedQuestion = normalizeText(payload.response);

    // Support actions coming from contextual helper buttons — AI-powered responses.
    if (payload.choiceId === "not_understood") {
      feedback = await generateHelpResponse(session, "not_understood");
      return {
        step: buildStep(session, feedback),
        progress: buildProgress(session),
      };
    }

    if (payload.choiceId === "need_example") {
      feedback = await generateHelpResponse(session, "need_example");
      return {
        step: buildStep(session, feedback),
        progress: buildProgress(session),
      };
    }

    if (payload.choiceId === "need_hint") {
      feedback = await generateHelpResponse(session, "need_hint");
      return {
        step: buildStep(session, feedback),
        progress: buildProgress(session),
      };
    }

    if (payload.choiceId === "ask_question") {
      if (askedQuestion.length < 4) {
        feedback = "Ecris ta question en quelques mots pour que je t'aide clairement.";
      } else {
        feedback = await generateHelpResponse(session, "ask_question", String(payload.response));
      }
      return {
        step: buildStep(session, feedback),
        progress: buildProgress(session),
      };
    }

    switch (session.currentStepId) {
      case "intro-level":
        if (payload.choiceId === "confident") {
          session.currentStepId = "concept-check";
        } else if (payload.choiceId === "not-at-all" || payload.choiceId === "a-bit") {
          session.currentStepId = "explain-context";
        } else {
          feedback = "Choisis une option pour qu'on continue.";
        }
        break;
      case "explain-context":
        if (payload.choiceId === "understood_continue") {
          session.currentStepId = "concept-check";
          feedback = "Parfait. On passe a une petite verification.";
        } else if (isConfusedAnswer(payload.response)) {
          feedback = "C'est normal. Dis-moi ce qui bloque: la definition, la methode, ou un exemple.";
        } else if (isStrongTextAnswer(payload.response, 12) && keywordMatches >= 1) {
          session.currentStepId = "concept-check";
        } else {
          feedback = "Essaie de me repondre avec au moins une notion du cours. Tu peux le faire !";
        }
        break;
      case "concept-check": {
        session.totalChecks += 1;
        const checkEval = await evaluateAnswer(session, String(payload.response ?? ""), "check");
        feedback = checkEval.feedback;
        if (checkEval.correct) {
          session.correctAnswers += 1;
          session.currentStepId = "practice";
        }
        break;
      }
      case "practice": {
        session.totalChecks += 1;
        const practiceEval = await evaluateAnswer(session, String(payload.response ?? ""), "practice");
        feedback = practiceEval.feedback;
        if (practiceEval.correct) {
          session.correctAnswers += 1;
          session.currentStepId = "recap-check";
        }
        break;
      }
      case "recap-check": {
        session.totalChecks += 1;
        const recapEval = await evaluateAnswer(session, String(payload.response ?? ""), "recap");
        feedback = recapEval.feedback;
        if (recapEval.correct) {
          session.correctAnswers += 1;
          session.currentStepId = "recap";
        }
        break;
      }
      case "recap":
        if (payload.choiceId === "restart") {
          session.currentStepId = "practice";
        } else if (payload.choiceId === "finish") {
          feedback = "Session terminee. Tu as bien travaille !";
        }
        break;
      default:
        session.currentStepId = "intro-level";
        break;
    }

    return {
      step: buildStep(session, feedback),
      progress: buildProgress(session),
    };
  },
};
