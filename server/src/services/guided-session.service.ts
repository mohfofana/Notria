import OpenAI from "openai";
import { z } from "zod";
import { PromptRegistry, runJsonPrompt } from "../observability/prompt-registry.js";

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
  courseProgramSessionId?: number;
  script: GuidedScript;
  topicKeywords: string[];
  currentStepId: SessionStepId;
  correctAnswers: number;
  totalChecks: number;
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

function fallbackScript(input: GuidedSessionStartInput): GuidedScript {
  const topic = input.topic?.trim() || "seance du jour";
  const title = input.title?.trim() || `Micro-session: ${topic}`;
  const objective = input.objectives?.[0] || `Comprendre les points cles de ${topic}`;
  const conceptHint = input.content?.keyConcepts?.[0] || "";
  const exerciseHint = input.content?.exercises?.[0] || `Donne un exemple simple sur ${topic}.`;

  const inferredVisualType = inferVisualType(topic, conceptHint || objective);

  return {
    topic,
    title,
    introLine1: `Aujourd'hui, on travaille ${topic} ensemble.`,
    introLine2: "Objectif: avancer pas a pas avec une methode claire.",
    contextLine1: input.description?.trim() || `${objective}.`,
    contextLine2: conceptHint || "Retiens cette idee cle, on la verifie juste apres.",
    checkLine1: "Verifions ta comprehension.",
    checkLine2: "Explique avec tes mots, meme si ce n'est pas parfait.",
    checkPrompt: `Comment tu expliquerais ${topic} a un camarade en classe ?`,
    practiceLine1: "Passons a la pratique.",
    practiceLine2: "Montre ton raisonnement etape par etape.",
    practicePrompt: exerciseHint,
    recapLine1: `Bon travail. Tu as progresse sur ${topic}.`,
    explainVisual: {
      type: inferredVisualType,
      title: `Tableau: ${topic}`,
      content: [objective, conceptHint || `Idee cle: ${topic}`].filter(Boolean).join("\n"),
      figure: inferredVisualType === "diagram" ? "triangle" : "method",
      steps: ["Definition", "Exemple rapide", "Question de verification"],
    },
    checkVisual: {
      type: "formula",
      title: "Question de comprehension",
      content: `A retenir\n${topic}\nPuis reponds avec tes mots`,
      figure: "method",
      steps: ["Lis", "Explique avec tes mots", "Donne un exemple"],
    },
    practiceVisual: {
      type: "exercise_card",
      title: title || `Exercice - ${topic}`,
      content: exerciseHint,
      figure: "equation",
      steps: ["Identifier les donnees", "Appliquer la methode", "Verifier le resultat"],
    },
    recapVisual: {
      type: "formula",
      title: "Methode en 3 etapes",
      content: ["1) Lire l'enonce", "2) Choisir la methode", "3) Verifier le resultat"].join("\n"),
      figure: "method",
      steps: ["Lire", "Calculer", "Verifier"],
    },
  };
}

function inferVisualType(topic: string, context: string): GuidedVisualType {
  const text = `${topic} ${context}`.toLowerCase();
  if (
    text.includes("triangle") ||
    text.includes("pythagore") ||
    text.includes("geometr") ||
    text.includes("schema") ||
    text.includes("repere")
  ) {
    return "diagram";
  }
  if (
    text.includes("exercice") ||
    text.includes("probleme") ||
    text.includes("application")
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
  return /[0-9=+\-*/()]/.test(value) || /\b(calcule|resous|determine|trouve|montre)\b/i.test(value);
}

function getTopicExerciseTemplate(topic: string): string {
  const t = normalizeText(topic);
  if (t.includes("vecteur")) {
    return "Dans un repere, A(1,2) et B(5,4). Calcule les coordonnees du vecteur AB puis sa norme.";
  }
  if (t.includes("pythagore")) {
    return "Triangle rectangle en B, AB=3 cm et BC=4 cm. Calcule AC en montrant les etapes.";
  }
  if (t.includes("equation")) {
    return "Resous: 2x + 5 = 17. Donne les etapes puis la valeur de x.";
  }
  return `Exercice: resous un cas simple sur ${topic}. Montre les etapes et le resultat final.`;
}

function ensureCoherentScript(base: GuidedScript, fallback: GuidedScript): GuidedScript {
  const contextAnchor = [base.topic, base.contextLine1, base.contextLine2].join(" ");
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

async function generateScript(input: GuidedSessionStartInput): Promise<GuidedScript> {
  const client = getOpenAIClient();
  if (!client) return fallbackScript(input);

  const topic = input.topic?.trim() || "seance du jour";
  const title = input.title?.trim() || "";
  const type = input.type?.trim() || "";
  const durationMinutes = Number.isFinite(input.durationMinutes) ? input.durationMinutes : undefined;
  const objectives = (input.objectives ?? []).slice(0, 3).join(" | ");
  const keyConcepts = (input.content?.keyConcepts ?? []).slice(0, 3).join(" | ");
  const exercises = (input.content?.exercises ?? []).slice(0, 2).join(" | ");
  const description = input.description?.trim() || "";

  const scriptSchema = z.object({
    topic: z.string().min(1),
    title: z.string().min(1),
    introLine1: z.string().min(1),
    introLine2: z.string().min(1),
    contextLine1: z.string().min(1),
    contextLine2: z.string().min(1),
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
      `Genere un script JSON pour une micro-session sur "${topic}".`,
      `Titre: ${title || "non fourni"}. Type: ${type || "non fourni"}.`,
      `Duree: ${durationMinutes ?? "non fournie"} min.`,
      `Description: ${description || "non fournie"}.`,
      `Objectifs: ${objectives || "non fournis"}.`,
      `Concepts cles: ${keyConcepts || "non fournis"}.`,
      `Exercices de reference: ${exercises || "non fournis"}.`,
      "JSON strict attendu avec champs script + visuals.",
    ].join("\n");

    const { data } = await runJsonPrompt({
      prompt: PromptRegistry.guidedScriptV1,
      schema: scriptSchema,
      userContent,
      retries: 3,
      temperature: 0.5,
      maxTokens: 900,
    });

    return sanitizeScript(data as Partial<GuidedScript>, input);
  } catch {
    return fallbackScript(input);
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
        return `Explication en cours: "${session.script.contextLine1}" / "${session.script.contextLine2}"`;
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
    "Tu es Prof Ada, un tuteur ivoirien bienveillant pour des eleves de 3eme (14-16 ans) en Cote d'Ivoire.",
    "Tu tutoies toujours. Ton chaleureux et respectueux, jamais familier excessif.",
    "Francais simple et naturel, phrases courtes (max 2-3 phrases).",
    "Utilise des exemples de vie quotidienne en Cote d'Ivoire quand c'est utile.",
    `Sujet: ${session.topic}.`,
    stepContext,
  ].join(" ");

  const userPrompts: Record<string, string> = {
    not_understood: [
      "L'eleve n'a pas compris. Reformule l'explication plus simplement.",
      "Utilise une analogie de la vie quotidienne en Cote d'Ivoire (marche, football, cuisine, transport, etc.).",
      "Sois encourageant. Maximum 3 phrases simples.",
    ].join(" "),
    need_example: [
      `Donne UN exemple concret et simple sur "${session.topic}".`,
      "L'exemple doit etre facile a comprendre pour un eleve ivoirien de 3eme.",
      "Si c'est un calcul, montre les etapes clairement. Maximum 4 phrases.",
    ].join(" "),
    need_hint: [
      `L'eleve est bloque sur: "${session.script.practicePrompt}".`,
      "Donne UN indice qui guide vers la solution sans la donner.",
      "Sois encourageant. Maximum 2 phrases.",
    ].join(" "),
    ask_question: [
      `L'eleve pose cette question: "${questionText || ""}".`,
      "Reponds clairement et simplement. Maximum 3 phrases.",
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
    `Sujet du cours: ${session.topic}.`,
    `Contenu du cours: ${session.script.contextLine1} ${session.script.contextLine2}`,
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
        coachLines: [script.contextLine1, script.contextLine2],
        prompt: "Lis bien, puis utilise les boutons en bas.",
        visual: script.explainVisual,
        interaction: {
          type: "choice",
          ctaLabel: "Continuer",
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
    const script = await generateScript(normalizedInput);
    const topicKeywords = buildTopicKeywords(normalizedInput, script);

    const session: GuidedSessionInstance = {
      id,
      topic: script.topic,
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
