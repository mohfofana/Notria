import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openai, CHAT_MODEL } from "../lib/openai.js";
import { PedagogicalContentService } from "./pedagogical-content.service.js";

/** Extract JSON from OpenAI responses that may be wrapped in ```json ... ``` */
function parseJsonResponse(content: string): any {
  let cleaned = content.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    cleaned = match[1].trim();
  }
  return JSON.parse(cleaned);
}

interface StudentProfile {
  examType: "BEPC" | "BAC";
  grade: "3eme" | "terminale";
  series?: "A1" | "A2" | "C" | "D";
  prioritySubjects: string[];
  targetScore?: number;
  weakSubjects?: string[];
  currentLevel?: Record<string, "dÃ©butant" | "intermÃ©diaire" | "avancÃ©">;
}

export const AIService = {
  async generatePersonalizedPlan(
    student: StudentProfile,
    assessmentResults: Record<string, { level: string; percentage: number }>,
  ): Promise<{
    phases: Array<{
      name: string;
      weeks: number;
      focus: string;
      subjects: string[];
      objectives: string[];
    }>;
    prediction: {
      targetScore: number;
      successProbability: number;
      estimatedMonths: number;
    };
  }> {
    const curriculumPromises = Object.keys(assessmentResults).map((subject) =>
      PedagogicalContentService.getCurriculumContext(subject, student.examType),
    );
    const curriculumContexts = await Promise.all(curriculumPromises);
    const fullCurriculumContext = curriculumContexts.join("\n\n");

    const systemPrompt = `Tu es un conseiller pÃ©dagogique expert pour le systÃ¨me Ã©ducatif ivoirien. Analyse les rÃ©sultats du test adaptatif et crÃ©e un plan personnalisÃ© de 4 mois pour atteindre l'objectif.

RÃ‰SULTATS DU TEST :
${Object.entries(assessmentResults)
  .map(([subject, data]) => `${subject}: ${data.level} (${data.percentage}%)`)
  .join("\n")}

PROFIL Ã‰LÃˆVE :
- Examen : ${student.examType}
- Classe : ${student.grade}${student.series ? ` (SÃ©rie ${student.series})` : ""}
- Objectif : ${student.targetScore}/20
- MatiÃ¨res prioritaires : ${student.prioritySubjects.join(", ")}

CONTEXTE PÃ‰DAGOGIQUE IVOIRIEN :
${fullCurriculumContext}

CRÃ‰E UN PLAN DE 4 MOIS avec :
1. 4 phases de 4 semaines chacune
2. Focus par matiÃ¨re selon les faiblesses dÃ©tectÃ©es et le programme officiel ivoirien
3. Objectifs hebdomadaires rÃ©alistes basÃ©s sur les rÃ©sultats du test
4. PrÃ©diction de rÃ©ussite basÃ©e sur les donnÃ©es rÃ©elles d'Ã©lÃ¨ves ivoiriens

FORMAT DE RÃ‰PONSE (JSON uniquement) :
{
  "phases": [
    {
      "name": "Phase 1: Bases solides",
      "weeks": 4,
      "focus": "Renforcer les fondamentaux selon le programme ivoirien",
      "subjects": ["MathÃ©matiques", "SVT"],
      "objectives": ["MaÃ®triser les concepts de base du programme officiel", "RÃ©soudre 80% des exercices faciles"]
    }
  ],
  "prediction": {
    "targetScore": ${student.targetScore},
    "successProbability": 78,
    "estimatedMonths": 4
  }
}

ADAPTE LE PLAN AU CONTEXTE IVOIRIEN :
- Respecte le calendrier scolaire ivoirien
- ConsidÃ¨re les spÃ©cificitÃ©s du systÃ¨me Ã©ducatif de CÃ´te d'Ivoire
- Adapte aux rythmes d'apprentissage des Ã©lÃ¨ves ivoiriens`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: "CrÃ©e un plan personnalisÃ© basÃ© sur ces rÃ©sultats et le contexte Ã©ducatif ivoirien.",
      },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return parseJsonResponse(content);
    } catch (error) {
      console.error("Error generating plan with OpenAI:", error);
      return this.getFallbackPlan(student, assessmentResults);
    }
  },

  async generateHomework(
    student: StudentProfile,
    subject: string,
    topic: string,
    difficulty: "facile" | "moyen" | "difficile",
  ): Promise<
    Array<{
      question: string;
      expectedAnswer: string;
      explanation?: string;
    }>
  > {
    const curriculumContext = await PedagogicalContentService.getCurriculumContext(subject, student.examType);

    const systemPrompt = `Tu es un professeur du systÃ¨me Ã©ducatif ivoirien. GÃ©nÃ¨re 5 exercices de devoirs sur le sujet "${topic}" en ${subject}.

NIVEAU : ${difficulty}
EXAMEN : ${student.examType}
CLASSE : ${student.grade}${student.series ? ` (SÃ©rie ${student.series})` : ""}

CONTEXTE PÃ‰DAGOGIQUE IVOIRIEN :
${curriculumContext}

INSTRUCTIONS :
- Exercices progressifs (du plus simple au plus complexe)
- AdaptÃ©s au programme officiel ivoirien ${student.examType}
- Avec rÃ©ponses dÃ©taillÃ©es et explications pÃ©dagogiques
- Format mathÃ©matique/science correct
- Utilise des exemples concrets du contexte africain/ivoirien quand pertinent
- Respecte les exigences du MinistÃ¨re de l'Ã‰ducation Nationale de CÃ´te d'Ivoire

FORMAT DE RÃ‰PONSE (JSON uniquement) :
[
  {
    "question": "Ã‰nonce de l'exercice complet et dÃ©taillÃ©",
    "expectedAnswer": "RÃ©ponse complÃ¨te et dÃ©taillÃ©e avec Ã©tapes de rÃ©solution",
    "explanation": "Explication pÃ©dagogique du concept et mÃ©thode de rÃ©solution"
  }
]

ADAPTE AU CONTEXTE IVOIRIEN :
- Utilise des exemples locaux quand possible
- Respecte les programmes officiels BEPC/BAC de CÃ´te d'Ivoire
- ConsidÃ¨re le niveau rÃ©el des Ã©lÃ¨ves ivoiriens`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `GÃ©nÃ¨re 5 exercices de ${difficulty} sur "${topic}" en ${subject} adaptÃ©s au programme ivoirien.`,
      },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return parseJsonResponse(content);
    } catch (error) {
      console.error("Error generating homework with OpenAI:", error);
      return this.getFallbackHomework(subject, topic, difficulty);
    }
  },

  getFallbackPlan(student: StudentProfile, results: Record<string, { level: string; percentage: number }>) {
    return {
      phases: [
        {
          name: "Phase 1: Bases solides",
          weeks: 4,
          focus: "Renforcer les fondamentaux",
          subjects: Object.keys(results),
          objectives: ["MaÃ®triser les concepts de base", "RÃ©soudre 80% des exercices faciles"],
        },
        {
          name: "Phase 2: Approfondissement",
          weeks: 4,
          focus: "DÃ©velopper les compÃ©tences",
          subjects: Object.keys(results),
          objectives: ["Travailler les exercices moyens", "Comprendre les applications"],
        },
        {
          name: "Phase 3: Intensif",
          weeks: 4,
          focus: "PrÃ©paration aux examens",
          subjects: Object.keys(results),
          objectives: ["BAC blancs", "RÃ©vision intensive"],
        },
        {
          name: "Phase 4: Sprint final",
          weeks: 4,
          focus: "Perfectionnement",
          subjects: Object.keys(results),
          objectives: ["Derniers ajustements", "Gestion du stress"],
        },
      ],
      prediction: {
        targetScore: student.targetScore || 14,
        successProbability: 75,
        estimatedMonths: 4,
      },
    };
  },

  getFallbackHomework(subject: string, topic: string, difficulty: string) {
    return [
      {
        question: `Exercice 1 (${difficulty}) - ${topic}`,
        expectedAnswer: "RÃ©ponse dÃ©taillÃ©e Ã  venir",
        explanation: "Explication pÃ©dagogique",
      },
      {
        question: `Exercice 2 (${difficulty}) - ${topic}`,
        expectedAnswer: "RÃ©ponse dÃ©taillÃ©e Ã  venir",
        explanation: "Explication pÃ©dagogique",
      },
    ];
  },
};
