import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getTopicsForSubject } from "@notria/shared";
import { deepseek, DEEPSEEK_MODEL } from "../lib/deepseek.js";
import { PedagogicalContentService } from "./pedagogical-content.service.js";

/** Extract JSON from DeepSeek responses that may be wrapped in ```json ... ``` */
function parseJsonResponse(content: string): any {
  let cleaned = content.trim();
  // Remove markdown code block wrappers
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
  currentLevel?: Record<string, "débutant" | "intermédiaire" | "avancé">;
}

interface GeneratedQuestion {
  subject: string;
  difficulty: "facile" | "moyen" | "difficile";
  topic?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  tags: string[];
}

function getSubjectSpecificRules(subject: string, examType: "BEPC" | "BAC"): string {
  const normalizedSubject = subject
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedSubject === "francais" && examType === "BAC") {
    return [
      "- Prioritise des formats de devoir BAC: commentaire compose, dissertation litteraire, resume-discussion.",
      "- Evite les questions purement definitoires hors contexte (ex: simple 'le roman est de quel genre?').",
      "- Exige une competence de methode: plan, argumentation, reperage de procedes, these/arguments.",
    ].join("\n");
  }
  if (normalizedSubject === "mathematiques") {
    return [
      "- La question doit etre un vrai exercice de calcul/raisonnement avec resolution explicite.",
      "- Evite les questions trivia de vocabulaire mathematique.",
    ].join("\n");
  }
  if (normalizedSubject === "svt" || normalizedSubject === "physique-chimie") {
    return [
      "- Propose des exercices de type devoir (analyse de situation, interpretation de schema, application de lois).",
      "- Evite les questions trop generales sans ancrage au programme.",
    ].join("\n");
  }
  return "- La question doit ressembler a un exercice de devoir scolaire reel, pas a un quiz generique.";
}

function isTooGenericQuestion(question: string): boolean {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const genericPatterns = [
    "de quel genre",
    "qui est l'auteur",
    "vrai ou faux",
    "choisissez la bonne reponse",
  ];

  return genericPatterns.some((pattern) => normalized.includes(pattern));
}

export const AIService = {
  async generateAdaptiveQuestion(
    student: StudentProfile,
    subject: string,
    difficulty: "facile" | "moyen" | "difficile",
    previousQuestions: GeneratedQuestion[] = []
  ): Promise<GeneratedQuestion> {
    // Get curriculum context from pedagogical content service
    const curriculumContext = await PedagogicalContentService.getCurriculumContext(subject, student.examType);
    const allowedTopics = getTopicsForSubject(subject, student.examType);
    const topicsText = allowedTopics.length > 0 ? allowedTopics.join(", ") : "(liste indisponible)";
    const subjectRules = getSubjectSpecificRules(subject, student.examType);

    const systemPrompt = `Tu es un expert en pédagogie pour le système éducatif ivoirien. Tu dois générer des questions adaptatives pour évaluer le niveau d'un élève.

CONTEXTE ÉLÈVE :
- Examen : ${student.examType}
- Classe : ${student.grade}${student.series ? ` (Série ${student.series})` : ""}
- Matières prioritaires : ${student.prioritySubjects.join(", ")}
- Note cible : ${student.targetScore ?? "non définie"}/20
- Niveau actuel en ${subject} : ${student.currentLevel?.[subject] ?? "inconnu"}
- Sujets faibles : ${student.weakSubjects?.join(", ") ?? "aucun spécifié"}

${curriculumContext}

INSTRUCTIONS POUR LA QUESTION :
1. La question doit être en français, adaptée au programme scolaire ivoirien officiel
2. Difficulté : ${difficulty} (adapte la complexité en conséquence)
3. Utilise des exemples concrets liés au contexte africain et ivoirien quand pertinent
4. Respecte strictement le programme officiel ${student.examType} de Côte d'Ivoire
5. La question doit avoir exactement 4 options (A, B, C, D)
6. Une seule réponse correcte
7. Fournis une explication détaillée de la réponse correcte
8. Ajoute des tags pour catégoriser la question (ex: "algèbre", "fonctions", "dérivées")

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "question": "Texte de la question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Explication détaillée de pourquoi cette réponse est correcte",
  "tags": ["tag1", "tag2"]
}

RÈGLES IMPORTANTES :
- Ne génère PAS de questions déjà posées
- Adapte le niveau selon les réponses précédentes
- Si l'élève a du mal, reviens à des concepts fondamentaux du programme
- Si l'élève réussit bien, augmente progressivement la difficulté
- Respecte les exigences pédagogiques ivoiriennes`;

    const previousQuestionsText = previousQuestions.length > 0
      ? `\n\nQUESTIONS DÉJÀ POSÉES (à éviter) :\n${previousQuestions.map((q, i) => `${i+1}. ${q.question}`).join('\n')}`
      : "";

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt + previousQuestionsText },
      {
        role: "user",
        content: [
          `Génère une question de difficulté "${difficulty}" en ${subject} pour cet élève.`,
          `Tu dois choisir un topic STRICTEMENT dans cette liste: ${topicsText}.`,
          "La question doit être un exercice type devoir ivoirien (BAC/BEPC), pas un quiz générique.",
          `Contraintes matière: ${subjectRules}`,
          "Retourne JSON valide avec 4 options, une seule bonne réponse, explication claire et tags.",
        ].join(" ")
      }
    ];

    try {
      const response = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from DeepSeek");
      }

      // Parse JSON response
      const parsed = parseJsonResponse(content) as GeneratedQuestion;

      if (
        !parsed.question ||
        !Array.isArray(parsed.options) ||
        parsed.options.length !== 4 ||
        typeof parsed.correctAnswer !== "number" ||
        parsed.correctAnswer < 0 ||
        parsed.correctAnswer > 3 ||
        isTooGenericQuestion(parsed.question)
      ) {
        throw new Error("Generated question is not aligned with expected quality");
      }

      return parsed;
    } catch (error) {
      console.error("Error generating question with DeepSeek:", error);
      // Fallback to a static question
      return this.getFallbackQuestion(subject, difficulty);
    }
  },

  async generatePersonalizedPlan(
    student: StudentProfile,
    assessmentResults: Record<string, { level: string; percentage: number }>
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
    // Get curriculum context for all subjects
    const curriculumPromises = Object.keys(assessmentResults).map(subject =>
      PedagogicalContentService.getCurriculumContext(subject, student.examType)
    );
    const curriculumContexts = await Promise.all(curriculumPromises);
    const fullCurriculumContext = curriculumContexts.join('\n\n');

    const systemPrompt = `Tu es un conseiller pédagogique expert pour le système éducatif ivoirien. Analyse les résultats du test adaptatif et crée un plan personnalisé de 4 mois pour atteindre l'objectif.

RÉSULTATS DU TEST :
${Object.entries(assessmentResults).map(([subject, data]) =>
  `${subject}: ${data.level} (${data.percentage}%)`
).join('\n')}

PROFIL ÉLÈVE :
- Examen : ${student.examType}
- Classe : ${student.grade}${student.series ? ` (Série ${student.series})` : ""}
- Objectif : ${student.targetScore}/20
- Matières prioritaires : ${student.prioritySubjects.join(", ")}

CONTEXTE PÉDAGOGIQUE IVOIRIEN :
${fullCurriculumContext}

CRÉE UN PLAN DE 4 MOIS avec :
1. 4 phases de 4 semaines chacune
2. Focus par matière selon les faiblesses détectées et le programme officiel ivoirien
3. Objectifs hebdomadaires réalistes basés sur les résultats du test
4. Prédiction de réussite basée sur les données réelles d'élèves ivoiriens

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "phases": [
    {
      "name": "Phase 1: Bases solides",
      "weeks": 4,
      "focus": "Renforcer les fondamentaux selon le programme ivoirien",
      "subjects": ["Mathématiques", "SVT"],
      "objectives": ["Maîtriser les concepts de base du programme officiel", "Résoudre 80% des exercices faciles"]
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
- Considère les spécificités du système éducatif de Côte d'Ivoire
- Adapte aux rythmes d'apprentissage des élèves ivoiriens`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Crée un plan personnalisé basé sur ces résultats et le contexte éducatif ivoirien." }
    ];

    try {
      const response = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from DeepSeek");
      }

      return parseJsonResponse(content);
    } catch (error) {
      console.error("Error generating plan with DeepSeek:", error);
      return this.getFallbackPlan(student, assessmentResults);
    }
  },

  async generateHomework(
    student: StudentProfile,
    subject: string,
    topic: string,
    difficulty: "facile" | "moyen" | "difficile"
  ): Promise<Array<{
    question: string;
    expectedAnswer: string;
    explanation?: string;
  }>> {
    // Get curriculum context for the subject
    const curriculumContext = await PedagogicalContentService.getCurriculumContext(subject, student.examType);

    const systemPrompt = `Tu es un professeur du système éducatif ivoirien. Génère 5 exercices de devoirs sur le sujet "${topic}" en ${subject}.

NIVEAU : ${difficulty}
EXAMEN : ${student.examType}
CLASSE : ${student.grade}${student.series ? ` (Série ${student.series})` : ""}

CONTEXTE PÉDAGOGIQUE IVOIRIEN :
${curriculumContext}

INSTRUCTIONS :
- Exercices progressifs (du plus simple au plus complexe)
- Adaptés au programme officiel ivoirien ${student.examType}
- Avec réponses détaillées et explications pédagogiques
- Format mathématique/science correct
- Utilise des exemples concrets du contexte africain/ivoirien quand pertinent
- Respecte les exigences du Ministère de l'Éducation Nationale de Côte d'Ivoire

FORMAT DE RÉPONSE (JSON uniquement) :
[
  {
    "question": "Énonce de l'exercice complet et détaillé",
    "expectedAnswer": "Réponse complète et détaillée avec étapes de résolution",
    "explanation": "Explication pédagogique du concept et méthode de résolution"
  }
]

ADAPTE AU CONTEXTE IVOIRIEN :
- Utilise des exemples locaux quand possible
- Respecte les programmes officiels BEPC/BAC de Côte d'Ivoire
- Considère le niveau réel des élèves ivoiriens`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Génère 5 exercices de ${difficulty} sur "${topic}" en ${subject} adaptés au programme ivoirien.` }
    ];

    try {
      const response = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from DeepSeek");
      }

      return parseJsonResponse(content);
    } catch (error) {
      console.error("Error generating homework with DeepSeek:", error);
      return this.getFallbackHomework(subject, topic, difficulty);
    }
  },

  getFallbackQuestion(subject: string, difficulty: string): GeneratedQuestion {
    // Fallback static questions
    const questions = {
      "Mathématiques": {
        facile: {
          subject: "Mathématiques",
          difficulty: "facile" as const,
          question: "Calcule 2 × 5 + 3",
          options: ["10", "13", "16", "23"],
          correctAnswer: 1,
          explanation: "2 × 5 = 10, puis 10 + 3 = 13",
          tags: ["arithmétique", "calcul"]
        },
        moyen: {
          subject: "Mathématiques",
          difficulty: "moyen" as const,
          question: "Résous l'équation : 2x + 3 = 7",
          options: ["x = 1", "x = 2", "x = 3", "x = 4"],
          correctAnswer: 1,
          explanation: "2x + 3 = 7 ⇒ 2x = 4 ⇒ x = 2",
          tags: ["équations", "algèbre"]
        },
        difficile: {
          subject: "Mathématiques",
          difficulty: "difficile" as const,
          question: "Calcule la dérivée de f(x) = x² + 2x + 1",
          options: ["f'(x) = x + 2", "f'(x) = 2x + 2", "f'(x) = 2x", "f'(x) = x²"],
          correctAnswer: 1,
          explanation: "Dérivée : f'(x) = 2x + 2",
          tags: ["dérivées", "calcul différentiel"]
        }
      }
    };

    return questions[subject as keyof typeof questions]?.[difficulty as keyof typeof questions["Mathématiques"]] ||
           questions["Mathématiques"]["facile"];
  },

  getFallbackPlan(student: StudentProfile, results: Record<string, { level: string; percentage: number }>) {
    return {
      phases: [
        {
          name: "Phase 1: Bases solides",
          weeks: 4,
          focus: "Renforcer les fondamentaux",
          subjects: Object.keys(results),
          objectives: ["Maîtriser les concepts de base", "Résoudre 80% des exercices faciles"]
        },
        {
          name: "Phase 2: Approfondissement",
          weeks: 4,
          focus: "Développer les compétences",
          subjects: Object.keys(results),
          objectives: ["Travailler les exercices moyens", "Comprendre les applications"]
        },
        {
          name: "Phase 3: Intensif",
          weeks: 4,
          focus: "Préparation aux examens",
          subjects: Object.keys(results),
          objectives: ["BAC blancs", "Révision intensive"]
        },
        {
          name: "Phase 4: Sprint final",
          weeks: 4,
          focus: "Perfectionnement",
          subjects: Object.keys(results),
          objectives: ["Derniers ajustements", "Gestion du stress"]
        }
      ],
      prediction: {
        targetScore: student.targetScore || 14,
        successProbability: 75,
        estimatedMonths: 4
      }
    };
  },

  getFallbackHomework(subject: string, topic: string, difficulty: string) {
    return [
      {
        question: `Exercice 1 (${difficulty}) - ${topic}`,
        expectedAnswer: "Réponse détaillée à venir",
        explanation: "Explication pédagogique"
      },
      {
        question: `Exercice 2 (${difficulty}) - ${topic}`,
        expectedAnswer: "Réponse détaillée à venir",
        explanation: "Explication pédagogique"
      }
    ];
  }
};
