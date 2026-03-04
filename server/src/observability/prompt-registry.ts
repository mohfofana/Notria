import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";

import { openai, CHAT_MODEL } from "../lib/openai.js";
import { AIMetricsService } from "./ai-metrics.service.js";

export interface PromptDefinition {
  id: string;
  version: string;
  system: string;
}

export const PromptRegistry = {
  guidedScriptV1: {
    id: "guided_script",
    version: "2.1.0",
    system: [
      "Tu es Prof Ada, tutrice IA pour eleves de 3eme en Cote d'Ivoire (14-16 ans).",
      "Tu generes des micro-cours STRUCTURES en JSON strict sans markdown.",
      "REGLES PEDAGOGIQUES:",
      "- Tu ENSEIGNES d'abord, tu questionnes APRES.",
      "- Chaque bloc suit: explication (definition + exemple concret + regle a retenir + piege classique) puis verification puis application.",
      "- Langage: francais simple, phrases courtes, zero jargon inutile.",
      "- Les exemples utilisent des chiffres concrets et contexte ivoirien quand pertinent.",
      "- Les questions ont une REPONSE PRECISE attendue (pas 'explique avec tes mots').",
      "- Une seule notion principale par bloc, progression du simple au plus complexe.",
      "- Respecte strictement le referentiel officiel fourni en contexte (DPFC/progression 3eme BEPC).",
      "- Si une info officielle manque, n'invente pas; reste sur le niveau 3eme et signale la limite implicitement via un exercice standard.",
    ].join(" "),
  } satisfies PromptDefinition,
  guidedEvalV1: {
    id: "guided_evaluation",
    version: "1.1.0",
    system: [
      "Tu evalues des reponses eleves. Retour JSON strict, concis et pedagogique.",
      "Methodologie d'evaluation:",
      "- Compare a la reponse attendue avec tolerance orthographique raisonnable (sans accepter une erreur de notion).",
      "- Classe l'erreur si faux: calcul, comprehension, inattention, formulation, partielle.",
      "- Si correct: valider + renforcer la notion comprise.",
      "- Si incorrect: valoriser l'effort + localiser l'erreur + corriger avec raisonnement + donner une astuce anti-erreur.",
      "- Ton ton reste bienveillant, jamais jugeant.",
    ].join(" "),
  } satisfies PromptDefinition,
  homeworkGenV1: {
    id: "homework_generation",
    version: "1.1.0",
    system: [
      "Tu generes des exercices scolaires en JSON strict, programme ivoirien BEPC niveau 3eme.",
      "Adapte le type d'exercice a la matiere demandee.",
      "Contraintes qualite:",
      "- Enonce clair, donnees suffisantes, pas d'ambiguite.",
      "- Reponse attendue unique et precise, avec unites si necessaire.",
      "- Difficulte progressive: facile -> moyen -> difficile.",
      "- En QCM, distracteurs realistes (erreurs frequentes), jamais absurdes.",
      "- Respecte le referentiel officiel present dans le contexte; n'invente pas de chapitre hors-programme.",
    ].join(" "),
  } satisfies PromptDefinition,
};

function extractJsonValue(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const objectStart = raw.indexOf("{");
  const objectEnd = raw.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return raw.slice(objectStart, objectEnd + 1);
  }
  const arrayStart = raw.indexOf("[");
  const arrayEnd = raw.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return raw.slice(arrayStart, arrayEnd + 1);
  }
  return null;
}

export async function runJsonPrompt<T>(params: {
  prompt: PromptDefinition;
  schema: z.ZodType<T>;
  userContent: string;
  retries?: number;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ data: T; usedFallback: boolean }> {
  const retries = Math.max(1, Math.min(params.retries ?? 2, 4));
  const stopTimer = AIMetricsService.startTimer(params.prompt.id, params.prompt.version);

  if (!process.env.OPENAI_API_KEY) {
    const latency = stopTimer();
    AIMetricsService.recordFallback(params.prompt.id, params.prompt.version, latency);
    throw new Error("OPENAI_UNAVAILABLE");
  }

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: params.prompt.system },
        { role: "user", content: params.userContent },
      ];

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || CHAT_MODEL,
        temperature: params.temperature ?? 0.4,
        max_tokens: params.maxTokens ?? 700,
        messages,
      });

      const raw = completion.choices[0]?.message?.content || "";
      const jsonRaw = extractJsonValue(raw);
      if (!jsonRaw) {
        AIMetricsService.recordQualityEvent(params.prompt.id, params.prompt.version);
        continue;
      }
      const parsed = JSON.parse(jsonRaw) as unknown;
      const result = params.schema.safeParse(parsed);
      if (!result.success) {
        AIMetricsService.recordQualityEvent(params.prompt.id, params.prompt.version);
        continue;
      }
      const latency = stopTimer();
      AIMetricsService.recordSuccess(params.prompt.id, params.prompt.version, latency);
      return { data: result.data, usedFallback: false };
    } catch {
      if (attempt === retries - 1) {
        const latency = stopTimer();
        AIMetricsService.recordFallback(params.prompt.id, params.prompt.version, latency);
        throw new Error("PROMPT_FAILED");
      }
    }
  }

  const latency = stopTimer();
  AIMetricsService.recordFallback(params.prompt.id, params.prompt.version, latency);
  throw new Error("PROMPT_FAILED");
}
