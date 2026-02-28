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

type SessionStepId =
  | "intro-level"
  | "explain-context"
  | "formula-gate"
  | "angle-90-explain"
  | "check-ac2"
  | "check-ac2-hint"
  | "check-ac"
  | "practice-step-1"
  | "practice-step-2"
  | "practice-step-3"
  | "recap";

interface RespondPayload {
  choiceId?: string;
  response?: string | number;
}

interface GuidedScript {
  topic: string;
  introLine1: string;
  introLine2: string;
  contextLine1: string;
  contextLine2: string;
  formulaLine1: string;
  formulaLine2: string;
  angleLine1: string;
  angleLine2: string;
  practiceLine1: string;
  practiceLine2: string;
  recapLine1: string;
}

interface GuidedSessionInstance {
  id: string;
  topic: string;
  script: GuidedScript;
  currentStepId: SessionStepId;
  correctAnswers: number;
  totalChecks: number;
}

const sessions = new Map<string, GuidedSessionInstance>();

const CHECK_AB = 3;
const CHECK_BC = 4;
const PRACTICE_AB = 5;
const PRACTICE_BC = 12;
const CHECK_AC2 = CHECK_AB ** 2 + CHECK_BC ** 2;
const CHECK_AC = Math.sqrt(CHECK_AC2);
const PRACTICE_AC = Math.sqrt(PRACTICE_AB ** 2 + PRACTICE_BC ** 2);

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

function fallbackScript(topic: string): GuidedScript {
  return {
    topic,
    introLine1: `Salut. Aujourd'hui on travaille ${topic}.`,
    introLine2: "Tu connais un peu ou c'est nouveau pour toi ?",
    contextLine1: "Imagine une situation concrete avec une diagonale a calculer.",
    contextLine2: "Comment tu t'y prendrais a ton avis ?",
    formulaLine1: "Bien essaye. On passe a la formule utile pour ce cas.",
    formulaLine2: "On l'applique seulement dans la bonne configuration.",
    angleLine1: "Un angle a 90 degres, c'est un angle droit.",
    angleLine2: "Repere cet angle avant d'appliquer la methode.",
    practiceLine1: "Maintenant on passe a un exercice type examen.",
    practiceLine2: "Fais chaque etape sans sauter de ligne.",
    recapLine1: "Bonne seance. Tu as avance avec une methode claire.",
  };
}

function sanitizeScript(candidate: Partial<GuidedScript>, topic: string): GuidedScript {
  const fallback = fallbackScript(topic);
  const pick = (value: unknown, backup: string) =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : backup;

  return {
    topic: pick(candidate.topic, fallback.topic),
    introLine1: pick(candidate.introLine1, fallback.introLine1),
    introLine2: pick(candidate.introLine2, fallback.introLine2),
    contextLine1: pick(candidate.contextLine1, fallback.contextLine1),
    contextLine2: pick(candidate.contextLine2, fallback.contextLine2),
    formulaLine1: pick(candidate.formulaLine1, fallback.formulaLine1),
    formulaLine2: pick(candidate.formulaLine2, fallback.formulaLine2),
    angleLine1: pick(candidate.angleLine1, fallback.angleLine1),
    angleLine2: pick(candidate.angleLine2, fallback.angleLine2),
    practiceLine1: pick(candidate.practiceLine1, fallback.practiceLine1),
    practiceLine2: pick(candidate.practiceLine2, fallback.practiceLine2),
    recapLine1: pick(candidate.recapLine1, fallback.recapLine1),
  };
}

async function generateScript(topic: string): Promise<GuidedScript> {
  const client = getOpenAIClient();
  if (!client) return fallbackScript(topic);

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "Tu es Prof Ada. Tu produis un micro-cours interactif en francais simple, 2 phrases max par bloc.",
        },
        {
          role: "user",
          content: [
            `Genere un script JSON pour une seance guidee sur: ${topic}.`,
            "Reponds en JSON strict avec les cles:",
            "topic,introLine1,introLine2,contextLine1,contextLine2,formulaLine1,formulaLine2,angleLine1,angleLine2,practiceLine1,practiceLine2,recapLine1",
            "Contraintes: phrases courtes, ton prof, pas de mur de texte, pas de markdown.",
          ].join(" "),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonRaw = extractJsonObject(content);
    if (!jsonRaw) return fallbackScript(topic);

    const parsed = JSON.parse(jsonRaw) as Partial<GuidedScript>;
    return sanitizeScript(parsed, topic);
  } catch {
    return fallbackScript(topic);
  }
}

function buildChoices(choices: Array<{ id: string; label: string }>): GuidedChoiceOption[] {
  return choices.map((choice) => ({ id: choice.id, label: choice.label }));
}

function buildProgress(session: GuidedSessionInstance): GuidedSessionProgress {
  const totalFlowChecks = 6;
  const completionPercent = Math.min(
    100,
    Math.round((session.totalChecks / totalFlowChecks) * 100)
  );

  return {
    correctAnswers: session.correctAnswers,
    totalChecks: session.totalChecks,
    completionPercent,
  };
}

function isEquivalentNumber(value: string | number | undefined, expected: number): boolean {
  if (typeof value === "number") return value === expected;
  if (typeof value !== "string") return false;
  const normalized = Number(value.replace(",", ".").trim());
  if (Number.isNaN(normalized)) return false;
  return normalized === expected;
}

function normalizeText(value: string | number | undefined): string {
  if (value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function containsAll(value: string, parts: string[]): boolean {
  return parts.every((part) => value.includes(part));
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
        prompt: "Choisis ton niveau de depart.",
        interaction: {
          type: "choice",
          ctaLabel: "Choisir",
          choices: buildChoices([
            { id: "not-at-all", label: "Pas du tout" },
            { id: "a-bit", label: "Un peu" },
            { id: "confident", label: "Je connais deja bien" },
          ]),
        },
      };
    case "explain-context":
      return {
        ...base,
        id: "explain-context",
        state: "EXPLAIN",
        coachLines: [script.contextLine1, script.contextLine2],
        prompt: "Reponds en vocal ou en texte, meme si c'est une hypothese.",
        visual: {
          type: "diagram",
          title: "Schema",
          content: "A ------- B\n|       /\n|     /\n|   /  ?\n| /\nD ------- C",
        },
        interaction: {
          type: "voice_or_text",
          ctaLabel: "Envoyer ma reponse",
          placeholder: "Ex: je fais cote x cote puis j'additionne...",
        },
      };
    case "formula-gate":
      return {
        ...base,
        id: "formula-gate",
        state: "EXPLAIN",
        coachLines: [script.formulaLine1, script.formulaLine2],
        prompt: "Tu veux continuer ou faire une parenthese sur l'angle a 90 degres ?",
        visual: {
          type: "formula",
          title: "Formule cle",
          content: "AC^2 = AB^2 + BC^2",
        },
        interaction: {
          type: "choice",
          ctaLabel: "Valider",
          choices: buildChoices([
            { id: "understood", label: "OK compris" },
            { id: "what-is-90", label: "C'est quoi 90 degres ?" },
          ]),
        },
      };
    case "angle-90-explain":
      return {
        ...base,
        id: "angle-90-explain",
        state: "EXPLAIN",
        coachLines: [script.angleLine1, script.angleLine2],
        prompt: "Si c'est clair, on lance la verification.",
        interaction: {
          type: "choice",
          ctaLabel: "Continuer",
          choices: buildChoices([{ id: "continue", label: "C'est clair, on continue" }]),
        },
      };
    case "check-ac2":
      return {
        ...base,
        id: "check-ac2",
        state: "CHECK",
        coachLines: [
          `Verifions ensemble: AB = ${CHECK_AB}, BC = ${CHECK_BC}.`,
          `Calcule AC^2 = ${CHECK_AB}^2 + ${CHECK_BC}^2.`,
        ],
        prompt: "Entre seulement la valeur de AC^2.",
        interaction: {
          type: "number",
          ctaLabel: "Valider",
          placeholder: "Ex: 25",
        },
      };
    case "check-ac2-hint":
      return {
        ...base,
        id: "check-ac2-hint",
        state: "CHECK",
        coachLines: [
          `Presque. Rappelle-toi: ${CHECK_AB}^2 = ${CHECK_AB ** 2} et ${CHECK_BC}^2 = ${CHECK_BC ** 2}.`,
          `Maintenant, ${CHECK_AB ** 2} + ${CHECK_BC ** 2} = ?`,
        ],
        prompt: "Refais le calcul.",
        interaction: {
          type: "number",
          ctaLabel: "Revalider",
          placeholder: "Ex: 25",
        },
      };
    case "check-ac":
      return {
        ...base,
        id: "check-ac",
        state: "VALIDATE",
        coachLines: [
          `Exact pour AC^2. Derniere etape: AC = racine de ${CHECK_AC2}.`,
          "Donc AC = ?",
        ],
        prompt: "Entre la valeur finale de AC.",
        interaction: {
          type: "number",
          ctaLabel: "Valider",
          placeholder: "Ex: 5",
        },
      };
    case "practice-step-1":
      return {
        ...base,
        id: "practice-step-1",
        state: "PRACTICE",
        coachLines: [script.practiceLine1, script.practiceLine2],
        prompt: "Etape 1: ecris la formule complete.",
        visual: {
          type: "exercise_card",
          title: "Exercice guide",
          content: `Triangle ABC rectangle en B. AB = ${PRACTICE_AB} cm, BC = ${PRACTICE_BC} cm. Calculer AC.`,
        },
        interaction: {
          type: "short_text",
          ctaLabel: "Valider l'etape 1",
          placeholder: "Ex: AC^2 = AB^2 + BC^2",
        },
      };
    case "practice-step-2":
      return {
        ...base,
        id: "practice-step-2",
        state: "PRACTICE",
        coachLines: [
          "Parfait. Etape 2: remplace les lettres par les valeurs.",
          `Prends bien AB = ${PRACTICE_AB} et BC = ${PRACTICE_BC}.`,
        ],
        prompt: "Ecris la ligne de remplacement.",
        interaction: {
          type: "short_text",
          ctaLabel: "Valider l'etape 2",
          placeholder: `Ex: AC^2 = ${PRACTICE_AB}^2 + ${PRACTICE_BC}^2`,
        },
      };
    case "practice-step-3":
      return {
        ...base,
        id: "practice-step-3",
        state: "PRACTICE",
        coachLines: [
          "Derniere etape: calcule la longueur AC.",
          "Tu peux faire AC^2 puis prendre la racine.",
        ],
        prompt: "Entre la valeur finale de AC.",
        interaction: {
          type: "number",
          ctaLabel: "Valider les reponses",
          placeholder: "Ex: 13",
        },
      };
    case "recap":
      return {
        ...base,
        id: "recap",
        state: "RECAP",
        coachLines: [
          script.recapLine1,
          `Score actuel: ${session.correctAnswers}/${session.totalChecks} verifications reussies.`,
        ],
        prompt: "Tu peux terminer ou refaire un exercice.",
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
        coachLines: ["On relance la seance."],
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
  async start(topic = "seance du jour"): Promise<GuidedSessionStartResponse> {
    const id = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    const script = await generateScript(topic);
    const session: GuidedSessionInstance = {
      id,
      topic,
      script,
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

  respond(sessionId: string, payload: RespondPayload): GuidedSessionRespondResponse {
    const session = ensureSession(sessionId);
    let feedback: string | undefined;

    switch (session.currentStepId) {
      case "intro-level":
        if (payload.choiceId === "not-at-all") {
          session.currentStepId = "explain-context";
        } else if (payload.choiceId === "a-bit") {
          session.currentStepId = "formula-gate";
        } else if (payload.choiceId === "confident") {
          session.currentStepId = "check-ac2";
        } else {
          feedback = "Choisis une option pour qu'on adapte la seance.";
        }
        break;
      case "explain-context":
        session.currentStepId = "formula-gate";
        break;
      case "formula-gate":
        if (payload.choiceId === "understood") {
          session.currentStepId = "check-ac2";
        } else if (payload.choiceId === "what-is-90") {
          session.currentStepId = "angle-90-explain";
        } else {
          feedback = "Selectionne une option pour continuer.";
        }
        break;
      case "angle-90-explain":
        session.currentStepId = "check-ac2";
        break;
      case "check-ac2":
      case "check-ac2-hint": {
        session.totalChecks += 1;
        if (isEquivalentNumber(payload.response, CHECK_AC2)) {
          session.correctAnswers += 1;
          session.currentStepId = "check-ac";
          feedback = `Exactement, AC^2 = ${CHECK_AC2}.`;
        } else {
          session.currentStepId = "check-ac2-hint";
          feedback = "Pas encore. On recalcule ensemble.";
        }
        break;
      }
      case "check-ac":
        session.totalChecks += 1;
        if (isEquivalentNumber(payload.response, CHECK_AC)) {
          session.correctAnswers += 1;
          session.currentStepId = "practice-step-1";
          feedback = "Bien joue. On passe a un exercice reel.";
        } else {
          feedback = `Pense a la racine carree: AC = racine de ${CHECK_AC2}.`;
        }
        break;
      case "practice-step-1": {
        session.totalChecks += 1;
        const answer = normalizeText(payload.response);
        if (containsAll(answer, ["ac", "ab", "bc"]) && answer.includes("=")) {
          session.correctAnswers += 1;
          session.currentStepId = "practice-step-2";
        } else {
          feedback = "On veut la formule generale complete.";
        }
        break;
      }
      case "practice-step-2": {
        session.totalChecks += 1;
        const answer = normalizeText(payload.response);
        if (answer.includes(String(PRACTICE_AB)) && answer.includes(String(PRACTICE_BC))) {
          session.correctAnswers += 1;
          session.currentStepId = "practice-step-3";
        } else {
          feedback = `Utilise bien ${PRACTICE_AB} et ${PRACTICE_BC} dans ta ligne.`;
        }
        break;
      }
      case "practice-step-3":
        session.totalChecks += 1;
        if (isEquivalentNumber(payload.response, PRACTICE_AC)) {
          session.correctAnswers += 1;
          session.currentStepId = "recap";
          feedback = `Excellent, AC = ${PRACTICE_AC} cm.`;
        } else {
          feedback = `Refais: AC^2 = ${PRACTICE_AB ** 2} + ${PRACTICE_BC ** 2} = ${PRACTICE_AB ** 2 + PRACTICE_BC ** 2}, puis racine.`;
        }
        break;
      case "recap":
        if (payload.choiceId === "restart") {
          session.currentStepId = "practice-step-1";
        } else if (payload.choiceId === "finish") {
          feedback = "Seance terminee. Bon travail.";
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
