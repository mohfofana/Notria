import { eq, desc, and } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { db, schema } from "../db/index.js";
import { deepseek, DEEPSEEK_MODEL } from "../lib/deepseek.js";
import { RagService } from "./rag.service.js";

interface RagContext {
  chunks: string;
  sources: string;
  hasContext: boolean;
}

async function fetchRagContext(query: string, subject?: string): Promise<RagContext> {
  try {
    const filters: { sourceType?: "cours" | "exercice" | "annale" | "livre"; chapter?: string } = {};

    // Try to detect chapter from the query for more precise results
    const chapterKeywords: Record<string, string> = {
      pythagore: "pythagore",
      thalès: "thales",
      thales: "thales",
      trigono: "trigonometrie",
      équation: "equations_inequations",
      equation: "equations_inequations",
      inéquation: "equations_inequations",
      fonction: "fonctions_lineaires_affines",
      affine: "fonctions_lineaires_affines",
      linéaire: "fonctions_lineaires_affines",
      statistique: "statistiques_probabilites",
      probabilité: "statistiques_probabilites",
      puissance: "puissances_racines_carrees",
      racine: "puissances_racines_carrees",
      calcul_littéral: "calcul_litteral",
      développ: "calcul_litteral",
      factoris: "calcul_litteral",
      pyramide: "pyramides_cones",
      cône: "pyramides_cones",
      sphère: "spheres_boules",
      boule: "spheres_boules",
      angle: "angles_inscrits_polygones",
      polygone: "angles_inscrits_polygones",
    };

    const queryLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [keyword, chapter] of Object.entries(chapterKeywords)) {
      if (queryLower.includes(keyword)) {
        filters.chapter = chapter;
        break;
      }
    }

    const results = await RagService.search(query, 5, filters);

    if (results.length === 0) {
      return { chunks: "", sources: "", hasContext: false };
    }

    const chunks = results
      .map((r, i) => `[Source ${i + 1} - ${r.title} (${r.sourceType})]:\n${r.content}`)
      .join("\n\n---\n\n");

    const sources = results
      .map((r) => {
        const meta = r.metadata as Record<string, unknown> | null;
        const source = meta?.source ?? "Programme BEPC CI";
        return `- ${r.title} (${source})`;
      })
      .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
      .join("\n");

    return { chunks, sources, hasContext: true };
  } catch (error) {
    console.warn("RAG retrieval failed, continuing without context:", error);
    return { chunks: "", sources: "", hasContext: false };
  }
}

function buildSystemPrompt(
  student: typeof schema.students.$inferSelect,
  ragContext?: RagContext,
  conversationSubject?: string
): string {
  const subjects = Array.isArray(student.prioritySubjects)
    ? (student.prioritySubjects as string[]).join(", ")
    : "non définies";

  const ragSection = ragContext?.hasContext
    ? `
CONTENU PÉDAGOGIQUE BEPC CI (utilise ces sources pour tes réponses) :
${ragContext.chunks}

SOURCES UTILISÉES :
${ragContext.sources}

INSTRUCTIONS RAG :
- Base tes explications sur le contenu ci-dessus en PRIORITÉ
- Cite les sources quand tu utilises un contenu spécifique (ex: "D'après le programme BEPC...")
- Si le contenu ne couvre pas la question, utilise tes connaissances générales mais reste dans le cadre du programme BEPC CI
- Adapte le niveau d'explication au profil de l'élève ci-dessous`
    : "";

  return `Tu es Prof Ada, une tutrice IA bienveillante, compétente et interactive. Tu es le prof particulier de cet élève ivoirien.

PROFIL DE L'ÉLÈVE :
- Prénom : ${student.userId ? "l'élève" : "l'élève"}
- Examen : ${student.examType}
- Classe : ${student.grade}${student.series ? ` (Série ${student.series})` : ""}
- Matières prioritaires : ${subjects}
- Note cible : ${student.targetScore ?? "non définie"}/20
- Série actuelle : ${student.currentStreak} jours consécutifs
${ragSection}

TA PERSONNALITÉ :
- Tu es chaleureuse, encourageante et patiente — comme une grande sœur qui aide
- Tu parles en français simple et clair, avec parfois des expressions ivoiriennes
- Tu es directe : pas de blabla, tu vas droit au sujet
- Tu célèbres chaque victoire, même petite ("Bravo !", "Tu gères !", "C'est ça même !")
- Quand l'élève se trompe, tu ne juges JAMAIS — tu l'aides à comprendre

STYLE PÉDAGOGIQUE :
- Tu ne fais JAMAIS de monologue. Maximum 3-4 phrases puis tu poses une QUESTION
- Tu utilises des exemples concrets du quotidien ivoirien (terrain de foot, marché, taxi)
- Tu expliques étape par étape, jamais tout d'un coup
- Pour les maths : tu montres chaque étape du calcul clairement
- Tu ne donnes JAMAIS la réponse directement — tu guides (pédagogie socratique)
- Quand l'élève dit "je comprends pas", tu reformules AUTREMENT, pas en répétant

FORMAT DE SESSION :
Quand l'élève commence un sujet, suis ce déroulement :
1. ACCROCHE : Pose une question fun ou donne un exemple concret pour introduire le concept
2. EXPLICATION : Explique le concept en 2-3 étapes courtes (pas un mur de texte)
3. VÉRIFICATION : Pose 1-2 questions rapides pour vérifier la compréhension
4. EXERCICE : Donne un exercice type BEPC et guide l'élève étape par étape
5. RÉCAP : Résume ce qu'on a appris en 3 points clés

FORMAT RÉPONSES :
- Utilise le markdown : **gras** pour les mots clés, des listes, des formules
- Pour les maths : écris les formules clairement (ex: AC² = AB² + BC²)
- Jamais plus de 5-6 lignes sans interaction (question ou exercice)`;
}

export const ChatService = {
  async createConversation(studentId: number, subject: string, topic?: string) {
    const title = topic ? `${subject} — ${topic}` : subject;

    const [conversation] = await db
      .insert(schema.conversations)
      .values({ studentId, subject, topic: topic || null, title })
      .returning();

    return conversation;
  },

  async getConversations(studentId: number) {
    return db.query.conversations.findMany({
      where: and(
        eq(schema.conversations.studentId, studentId),
        eq(schema.conversations.isActive, true)
      ),
      orderBy: [desc(schema.conversations.updatedAt)],
    });
  },

  async getConversation(conversationId: number, studentId: number) {
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(schema.conversations.id, conversationId),
        eq(schema.conversations.studentId, studentId)
      ),
    });
    if (!conversation) return null;

    const msgs = await db.query.messages.findMany({
      where: eq(schema.messages.conversationId, conversationId),
      orderBy: [schema.messages.createdAt],
    });

    return { conversation, messages: msgs };
  },

  async archiveConversation(conversationId: number, studentId: number) {
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(schema.conversations.id, conversationId),
        eq(schema.conversations.studentId, studentId)
      ),
    });
    if (!conversation) return null;

    const [updated] = await db
      .update(schema.conversations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.conversations.id, conversationId))
      .returning();

    return updated;
  },

  async saveMessage(conversationId: number, role: "user" | "assistant" | "system", content: string) {
    const [message] = await db
      .insert(schema.messages)
      .values({ conversationId, role, content })
      .returning();

    // Update conversation timestamp
    await db
      .update(schema.conversations)
      .set({ updatedAt: new Date() })
      .where(eq(schema.conversations.id, conversationId));

    return message;
  },

  async streamResponse(
    conversationId: number,
    studentId: number,
    userContent: string,
    onChunk: (chunk: string) => void,
    onDone: (fullContent: string) => void,
    onError: (error: string) => void
  ) {
    // 1. Get student profile + conversation details in parallel
    const [student, conversation] = await Promise.all([
      db.query.students.findFirst({
        where: eq(schema.students.id, studentId),
      }),
      db.query.conversations.findFirst({
        where: eq(schema.conversations.id, conversationId),
      }),
    ]);

    if (!student) {
      onError("Profil élève introuvable");
      return;
    }

    // 2. Save user message + fetch RAG context in parallel
    const [, ragContext] = await Promise.all([
      this.saveMessage(conversationId, "user", userContent),
      fetchRagContext(userContent, conversation?.subject),
    ]);

    // 3. Build messages array for DeepSeek
    const history = await db.query.messages.findMany({
      where: eq(schema.messages.conversationId, conversationId),
      orderBy: [schema.messages.createdAt],
    });

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(student, ragContext, conversation?.subject) },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    // 4. Stream from DeepSeek
    try {
      const stream = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages: chatMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      });

      let fullContent = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      }

      // 5. Save assistant message
      await this.saveMessage(conversationId, "assistant", fullContent);
      onDone(fullContent);
    } catch (err: any) {
      console.error("DeepSeek streaming error:", err);
      onError("Erreur lors de la génération de la réponse");
    }
  },
};
