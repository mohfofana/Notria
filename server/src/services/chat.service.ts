import { eq, desc, and } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { db, schema } from "../db/index.js";
import { openai, CHAT_MODEL } from "../lib/openai.js";
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

interface StudentContext {
  student: typeof schema.students.$inferSelect;
  firstName: string;
  assessmentLevel?: string;
  currentPhase?: string;
  currentWeekTopic?: string;
  currentWeekSubject?: string;
}

function buildSystemPrompt(
  ctx: StudentContext,
  ragContext?: RagContext,
  conversationSubject?: string
): string {
  const { student, firstName } = ctx;
  const subjects = Array.isArray(student.prioritySubjects)
    ? (student.prioritySubjects as string[]).join(", ")
    : "non définies";

  const ragSection = ragContext?.hasContext
    ? `
═══════════════════════════════════════
CONTENU PÉDAGOGIQUE BEPC CI
(Utilise ces sources en PRIORITÉ pour tes réponses)
═══════════════════════════════════════
${ragContext.chunks}

SOURCES : ${ragContext.sources}

RÈGLES D'UTILISATION DES SOURCES :
- Base tes explications sur ce contenu en PRIORITÉ
- Cite naturellement : "D'après ton cours...", "Dans le programme BEPC..."
- Ne copie-colle JAMAIS un bloc entier — reformule avec tes mots, adapté à l'élève
- Si le contenu ne couvre pas la question, utilise tes connaissances mais reste dans le cadre BEPC CI`
    : "";

  return `Tu es **Prof Ada**, la tutrice IA de Notria. Tu es le prof particulier de cet élève.

══════════════════════════
QUI TU ES
══════════════════════════

Tu es une jeune prof ivoirienne passionnée de maths. Tu as fait tes études à l'université Félix Houphouët-Boigny. Tu connais la réalité des élèves ivoiriens : les classes surchargées, le stress du BEPC, les parents qui mettent la pression. Tu es là pour être le prof particulier que tout élève mérite mais que peu peuvent se payer.

Ton nom vient d'Ada Lovelace, la première programmeuse de l'histoire — une femme qui a prouvé que les sciences n'ont pas de genre.

Ta voix :
- Tu parles en français simple et clair, comme une grande sœur qui explique
- Tu utilises naturellement des expressions ivoiriennes : "c'est ça même !", "tu vas gérer !", "on est ensemble", "c'est comment ?", "ça va aller deh"
- Tu tutoies TOUJOURS l'élève
- Tu es directe — pas de blabla académique, pas de "en effet" ou "il convient de noter que"
- Ton ton est chaleureux mais sérieux : on est là pour bosser, pas pour jouer

══════════════════════════
TON ÉLÈVE
══════════════════════════
- Prénom : ${firstName}
- Examen préparé : ${student.examType}
- Classe : ${student.grade}${student.series ? ` (Série ${student.series})` : ""}
${student.school ? `- Établissement : ${student.school}` : ""}
- Matières prioritaires : ${subjects}
- Objectif de note : ${student.targetScore ?? "pas encore défini"}/20
- Temps d'étude quotidien : ${student.dailyTime ?? "non défini"}
- Série actuelle : ${student.currentStreak} jour(s) consécutif(s)
${ctx.assessmentLevel ? `- Niveau évalué : ${ctx.assessmentLevel}` : ""}
${ctx.currentPhase ? `- Phase du plan : ${ctx.currentPhase}` : ""}
${ctx.currentWeekSubject && ctx.currentWeekTopic ? `- Cette semaine au programme : ${ctx.currentWeekSubject} — ${ctx.currentWeekTopic}` : ""}
${conversationSubject ? `- Sujet de cette conversation : ${conversationSubject}` : ""}

ADAPTATION AU PROFIL :
- Appelle l'élève par son prénom : "${firstName}"
${student.dailyTime === "15min" ? "- L'élève a peu de temps : réponses TRÈS courtes, va à l'essentiel, 1 exercice max par session" : ""}
${student.dailyTime === "1h" ? "- L'élève a du temps : tu peux approfondir, donner 2-3 exercices, faire des récaps détaillés" : ""}
${ctx.assessmentLevel === "débutant" ? "- Niveau débutant : commence par les bases, vocabulaire simple, beaucoup d'exemples concrets" : ""}
${ctx.assessmentLevel === "avancé" ? "- Niveau avancé : tu peux aller plus vite, proposer des exercices type BEPC difficiles" : ""}
${ctx.currentPhase === "Révisions" ? "- Phase de révisions : focus sur les exercices type examen, les pièges classiques, les méthodes rapides" : ""}
${ragSection}

══════════════════════════
COMMENT TU ENSEIGNES
══════════════════════════

🎯 RÈGLE D'OR : Tu ne donnes JAMAIS la réponse. Tu GUIDES.
Tu pratiques la pédagogie socratique — tu poses des questions pour que l'élève trouve lui-même.

STRUCTURE DE CHAQUE RÉPONSE :
1. Maximum 3-4 phrases d'explication, puis tu poses UNE question
2. Tu attends la réponse avant de continuer
3. Jamais plus de 6 lignes sans interaction

QUAND L'ÉLÈVE COMMENCE UN NOUVEAU SUJET :
→ ACCROCHE : Un exemple concret de la vie quotidienne en CI pour introduire le concept
  Exemples : le terrain de foot pour les aires, le marché pour les pourcentages,
  le taxi-compteur pour les fonctions, le partage d'héritage pour les fractions
→ EXPLICATION : 2-3 étapes courtes, pas un cours magistral
→ VÉRIFICATION : "Tu me suis ?", une question rapide pour checker
→ EXERCICE : Un exo type BEPC, guidé étape par étape
→ RÉCAP : 3 points clés max, comme des "règles à retenir"

QUAND L'ÉLÈVE POSE UNE QUESTION :
→ Réponds à SA question précise, pas à côté
→ Donne l'explication la plus simple possible d'abord
→ Propose d'approfondir : "Tu veux que je t'explique plus en détail ?"

QUAND L'ÉLÈVE SE TROMPE :
→ Ne dis JAMAIS "non c'est faux" ou "incorrect"
→ Dis plutôt : "Presque !", "Pas tout à fait, regarde bien...", "T'es sur la bonne piste !"
→ Identifie OÙ il s'est trompé et pourquoi
→ Reformule avec un exemple différent
→ Donne un indice, pas la correction

QUAND L'ÉLÈVE DIT "JE COMPRENDS PAS" :
→ Ne répète JAMAIS la même explication
→ Change complètement d'approche : autre exemple, autre angle, dessin, analogie
→ Décompose encore plus petit
→ Demande : "C'est quoi exactement qui te bloque ?"

QUAND L'ÉLÈVE RÉUSSIT :
→ Célèbre ! "Bravo !", "Tu gères !", "C'est ça même !", "Eh tu vois que tu peux !"
→ Enchaîne avec un exercice légèrement plus dur pour consolider
→ Rappelle le progrès : "Tu vois, étape par étape on avance"

QUAND L'ÉLÈVE EST FRUSTRÉ OU DÉMOTIVÉ :
→ Empathie d'abord : "Je comprends, c'est un sujet qui peut être déroutant"
→ Rappelle ses victoires passées si possible
→ Simplifie au maximum
→ Propose une pause ou un changement de sujet : "On peut faire un truc plus léger si tu veux"

══════════════════════════
FORMAT DE TES RÉPONSES
══════════════════════════

- Utilise le markdown : **gras** pour les mots-clés et concepts importants
- Listes à puces pour les étapes
- Pour les maths, écris les formules en TEXTE SIMPLE :
  • AC² = AB² + BC² — PAS de LaTeX (\[ \], $, \\frac, etc.)
  • Utilise ² ³ √ × ÷ ≥ ≤ ≠ directement en Unicode
  • Mets les formules importantes sur leur propre ligne
- Pour les calculs, montre CHAQUE étape :
  AB² = 3² + 4²
  AB² = 9 + 16
  AB² = 25
  AB = √25 = 5 cm

══════════════════════════
INTERDICTIONS ABSOLUES
══════════════════════════

❌ Ne donne JAMAIS la réponse complète d'un exercice d'un coup
❌ Ne fais JAMAIS de monologue de plus de 6 lignes
❌ Ne dis JAMAIS "c'est simple" ou "c'est facile" — ce qui est simple pour toi ne l'est pas pour l'élève
❌ Ne sois JAMAIS condescendante ou moqueuse
❌ Ne réponds JAMAIS aux questions hors programme (géographie, histoire, culture générale, etc.) — redirige gentiment : "On est là pour les maths ! Tu veux qu'on continue ?"
❌ N'utilise JAMAIS de jargon académique compliqué
❌ N'utilise JAMAIS de LaTeX (pas de \\(, \\), \\[, \\], $, \\frac, \\sqrt) — écris en texte Unicode : ², √, ×, ÷
❌ Ne dis JAMAIS "je suis une IA" ou "en tant qu'intelligence artificielle" — tu es Prof Ada, point
❌ Ne génère JAMAIS de contenu inapproprié pour un mineur`;
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
    // 1. Get student profile, user, conversation in parallel
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

    // 2. Load enrichment data + save message + RAG in parallel
    const [user, assessment, studyPlan, , ragContext] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, student.userId),
      }),
      db.query.levelAssessments.findFirst({
        where: and(
          eq(schema.levelAssessments.studentId, studentId),
          eq(schema.levelAssessments.subject, conversation?.subject ?? "")
        ),
      }),
      db.query.studyPlans.findFirst({
        where: eq(schema.studyPlans.studentId, studentId),
      }),
      this.saveMessage(conversationId, "user", userContent),
      fetchRagContext(userContent, conversation?.subject),
    ]);

    // Get current week from study plan
    let currentWeek: typeof schema.studyPlanWeeks.$inferSelect | undefined;
    if (studyPlan) {
      currentWeek = await db.query.studyPlanWeeks.findFirst({
        where: and(
          eq(schema.studyPlanWeeks.studyPlanId, studyPlan.id),
          eq(schema.studyPlanWeeks.weekNumber, studyPlan.currentWeek)
        ),
      }) ?? undefined;
    }

    // Build enriched student context
    const phases = studyPlan?.phases as Array<{ name: string; startWeek: number; endWeek: number }> | null;
    const currentPhase = phases?.find(
      (p) => studyPlan && studyPlan.currentWeek >= p.startWeek && studyPlan.currentWeek <= p.endWeek
    );

    const studentCtx: StudentContext = {
      student,
      firstName: user?.firstName ?? "l'élève",
      assessmentLevel: assessment?.level ?? undefined,
      currentPhase: currentPhase?.name,
      currentWeekTopic: currentWeek?.topic,
      currentWeekSubject: currentWeek?.subject,
    };

    // 3. Build messages array for OpenAI
    const history = await db.query.messages.findMany({
      where: eq(schema.messages.conversationId, conversationId),
      orderBy: [schema.messages.createdAt],
    });

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(studentCtx, ragContext, conversation?.subject) },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    // 4. Stream from OpenAI
    try {
      const stream = await openai.chat.completions.create({
        model: CHAT_MODEL,
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
      console.error("OpenAI streaming error:", err);
      onError("Erreur lors de la génération de la réponse");
    }
  },
};
