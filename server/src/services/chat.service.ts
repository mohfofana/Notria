import { eq, desc, and } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { db, schema } from "../db/index.js";
import { deepseek, DEEPSEEK_MODEL } from "../lib/deepseek.js";

function buildSystemPrompt(student: typeof schema.students.$inferSelect): string {
  const subjects = Array.isArray(student.prioritySubjects)
    ? (student.prioritySubjects as string[]).join(", ")
    : "non définies";

  return `Tu es Prof Ada, une tutrice IA bienveillante et compétente. Tu aides les élèves ivoiriens à préparer leurs examens.

PROFIL DE L'ÉLÈVE :
- Examen : ${student.examType}
- Classe : ${student.grade}${student.series ? ` (Série ${student.series})` : ""}
- Matières prioritaires : ${subjects}
- Note cible : ${student.targetScore ?? "non définie"}/20

FORMAT DE SESSION :
Quand l'élève commence une session sur un sujet, tu suis ce déroulement :
1. **COURS** : Tu expliques le chapitre de façon claire et structurée (définitions, formules, théorèmes, exemples)
2. **VÉRIFICATION** : Tu poses 1-2 questions rapides pour vérifier que l'élève a compris
3. **EXERCICES** : Tu donnes 3 exercices progressifs (facile → moyen → difficile) en rapport avec le cours
4. **CORRECTION** : Quand l'élève répond, tu corriges en détail et tu expliques les erreurs

TES RÈGLES :
1. Tu parles en français simple et clair, adapté au niveau de l'élève
2. Tu expliques étape par étape, avec des exemples concrets
3. Tu utilises des exemples en lien avec le contexte africain et ivoirien quand c'est pertinent
4. Tu es encourageante et patiente — jamais condescendante
5. Tu restes dans le cadre du programme scolaire ivoirien (${student.examType})
6. Quand l'élève se trompe, tu l'aides à comprendre son erreur sans le décourager
7. Tu ne donnes pas la réponse directement aux exercices — tu guides l'élève
8. Tes réponses sont structurées avec des titres, listes et formules bien formatées
9. Pour les maths et sciences, écris les formules de façon lisible (ex: x² + 2x + 1 = 0)
10. À la fin de la session, fais un récapitulatif de ce que l'élève a appris`;
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
    // 1. Get student profile
    const student = await db.query.students.findFirst({
      where: eq(schema.students.id, studentId),
    });
    if (!student) {
      onError("Profil élève introuvable");
      return;
    }

    // 2. Save user message
    await this.saveMessage(conversationId, "user", userContent);

    // 3. Build messages array for DeepSeek
    const history = await db.query.messages.findMany({
      where: eq(schema.messages.conversationId, conversationId),
      orderBy: [schema.messages.createdAt],
    });

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(student) },
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
