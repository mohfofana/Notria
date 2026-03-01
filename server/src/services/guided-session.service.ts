import OpenAI from "openai";

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

  return {
    topic,
    title,
    introLine1: `Eh ! Aujourd'hui on attaque ${topic} ensemble.`,
    introLine2: `C'est important pour ton BEPC. On va gerer ca tranquille, etape par etape.`,
    contextLine1: input.description?.trim() || `${objective}.`,
    contextLine2: conceptHint || `Retiens bien ce truc la, on va verifier juste apres si tu as capte.`,
    checkLine1: "Bon, voyons si tu as capte le truc.",
    checkLine2: "Dis-moi avec tes propres mots, meme si c'est pas parfait c'est pas grave.",
    checkPrompt: `Comment tu expliquerais ${topic} a un camarade en classe ?`,
    practiceLine1: "Allez, maintenant on pratique pour de vrai !",
    practiceLine2: "Montre-moi comment tu fais, etape par etape.",
    practicePrompt: exerciseHint,
    recapLine1: `Tu as gere ! Tu as bien avance sur ${topic}.`,
  };
}

function sanitizeScript(candidate: Partial<GuidedScript>, input: GuidedSessionStartInput): GuidedScript {
  const fallback = fallbackScript(input);
  const pick = (value: unknown, backup: string) =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : backup;

  return {
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
  };
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

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: [
            "Tu es Prof Ada, un tuteur ivoirien bienveillant pour des eleves de 3eme (14-16 ans) en Cote d'Ivoire.",
            "Tu parles comme un grand frere / grande soeur ivoirien(ne) qui aide un petit a reviser.",
            "STYLE OBLIGATOIRE:",
            "- Francais ivoirien naturel, comme on parle a Abidjan entre jeunes.",
            "- Tu peux utiliser des expressions courantes: 'on est ensemble', 'c'est clair non ?', 'tu vois le truc ?', 'c'est pas complique han', 'on va gerer ca', 'tu as capte ?', 'tranquille', 'doucement doucement', etc.",
            "- Tu tutoies toujours. Phrases courtes. Ton chaleureux et encourageant.",
            "- JAMAIS d'accents dans le texte (pas de e accent, pas de a accent, etc). Ecris sans accents.",
            "- Les exemples et analogies doivent etre ivoiriens: marche, transport, garba, allocodrome, football, maquis, etc.",
            "- Tu es strict sur le contenu academique mais cool dans la facon de l'expliquer.",
            "Reponse JSON stricte, pas de markdown.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `Genere un script JSON pour une micro-session sur "${topic}".`,
            `Titre: ${title || "non fourni"}. Type: ${type || "non fourni"}.`,
            `Duree: ${durationMinutes ?? "non fournie"} min.`,
            `Description: ${description || "non fournie"}.`,
            `Objectifs: ${objectives || "non fournis"}.`,
            `Concepts cles: ${keyConcepts || "non fournis"}.`,
            `Exercices de reference: ${exercises || "non fournis"}.`,
            "",
            "STRUCTURE EXACTE du JSON (respecte le role de chaque champ):",
            "- topic: le sujet en quelques mots",
            "- title: titre court de la session",
            "- introLine1: accroche chaleureuse ivoirienne (ex: 'Eh mon ami ! Aujourd'hui on attaque les equations ensemble.')",
            "- introLine2: phrase qui motive (ex: 'Ca va t'aider pour le BEPC, on va gerer ca tranquille.')",
            "- contextLine1: EXPLICATION CLAIRE du concept, comme si tu expliquais a ton petit frere. Utilise une analogie du quotidien ivoirien si possible. 1-2 phrases.",
            "- contextLine2: suite de l'explication, un detail important. 1-2 phrases.",
            "- checkLine1: intro verification, ton decontracte (ex: 'Bon, voyons si tu as capte le truc.')",
            "- checkLine2: consigne claire et encourageante (ex: 'Dis-moi avec tes propres mots, meme si c'est pas parfait c'est pas grave.')",
            "- checkPrompt: UNE VRAIE QUESTION de comprehension (PAS oui/non). Ex: 'C'est quoi la difference entre X et Y ?' ou 'Explique-moi comment on fait pour...'",
            "- practiceLine1: intro exercice motivante (ex: 'Allez, maintenant on pratique pour de vrai !')",
            "- practiceLine2: consigne (ex: 'Montre-moi les etapes, comment tu fais.')",
            "- practicePrompt: UN EXERCICE CONCRET avec des valeurs. Ex: 'Resous: 2x + 3 = 11' ou 'Calcule l'aire d'un triangle de base 6cm et hauteur 4cm.'",
            "- recapLine1: felicitation chaleureuse (ex: 'Mon gars/Ma go, tu as gere ! Tu as compris que...')",
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonRaw = extractJsonObject(content);
    if (!jsonRaw) return fallbackScript(input);

    const parsed = JSON.parse(jsonRaw) as Partial<GuidedScript>;
    return sanitizeScript(parsed, input);
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
    "Tu parles comme un grand frere / grande soeur ivoirien(ne) a Abidjan.",
    "Francais ivoirien naturel, phrases courtes (max 2-3 phrases). Pas d'accents (pas de e accent, etc.).",
    "Expressions ok: 'tu vois ?', 'c'est pas complique han', 'on est ensemble', 'tranquille', 'doucement doucement', 'tu as capte ?', etc.",
    "Analogies ivoiriennes: marche, garba, football, transport gbaka, etc.",
    "Tu tutoies toujours. Ton chaleureux, jamais condescendant.",
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
      return `Tranquille, on reprend doucement. ${session.topic}, c'est comme une recette de garba: tu suis les etapes une par une et ca va aller.`;
    case "need_example":
      return `Ok, imagine un exemple simple sur ${session.topic}. Commence par regarder ce que tu connais deja, et on avance a partir de la.`;
    case "need_hint":
      return `Petit indice: relis bien l'enonce et repere les infos qu'on te donne. Commence par la premiere etape, doucement doucement.`;
    case "ask_question":
      return `Bonne question ! Pour ${session.topic}, retiens que chaque etape doit etre faite dans l'ordre. On est ensemble.`;
    default:
      return "On est ensemble. Dis-moi ce qui te bloque.";
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
    "Tu parles comme un grand frere / grande soeur ivoirien(ne).",
    "Francais ivoirien naturel, phrases courtes. Pas d'accents.",
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
    '- Si n\'importe quoi: "Eh, ca c\'est pas une reponse han ! Relis la question et essaie serieusement."',
  ].join("\n");

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    const jsonRaw = extractJsonObject(content);
    if (!jsonRaw) return fallbackEvaluation(session, answer, stepType);

    const parsed = JSON.parse(jsonRaw) as { correct?: boolean; feedback?: string };
    if (typeof parsed.correct !== "boolean" || typeof parsed.feedback !== "string") {
      return fallbackEvaluation(session, answer, stepType);
    }
    return { correct: parsed.correct, feedback: parsed.feedback };
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
    return { correct: false, feedback: "C'est pas grave han. Essaie de repondre meme si t'es pas sur, on est la pour apprendre." };
  }
  if (correct) {
    return { correct: true, feedback: `C'est bien, tu as compris le truc sur ${session.topic}. On avance !` };
  }
  return { correct: false, feedback: "C'est pas encore ca. Developpe un peu plus ta reponse, mets au moins une notion du cours." };
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
        visual: {
          type: "exercise_card",
          title: script.title,
          content: script.practicePrompt,
        },
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
          feedback = "C'est bon, tu as capte ! On va verifier ca vite fait.";
        } else if (isConfusedAnswer(payload.response)) {
          feedback = "Tranquille, c'est normal. Dis-moi ce qui bloque: la definition, la methode ou tu veux un exemple ?";
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
