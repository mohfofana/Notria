import type { Request, Response } from "express";
import { createConversationSchema, sendMessageSchema } from "@notria/shared";
import { eq } from "drizzle-orm";

import { ChatService } from "../services/chat.service.js";
import { db, schema } from "../db/index.js";

async function getStudentId(userId: number): Promise<number | null> {
  const student = await db.query.students.findFirst({
    where: eq(schema.students.userId, userId),
  });
  return student?.id ?? null;
}

export const ChatController = {
  /** POST /api/chat — Create a new conversation */
  async create(req: Request, res: Response) {
    const parsed = createConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    }

    const studentId = await getStudentId(req.user!.userId);
    if (!studentId) return res.status(404).json({ error: "Profil élève introuvable" });

    const conversation = await ChatService.createConversation(
      studentId,
      parsed.data.subject,
      parsed.data.topic
    );
    return res.status(201).json({ conversation });
  },

  /** GET /api/chat — List conversations */
  async list(req: Request, res: Response) {
    const studentId = await getStudentId(req.user!.userId);
    if (!studentId) return res.status(404).json({ error: "Profil élève introuvable" });

    const conversations = await ChatService.getConversations(studentId);
    return res.json({ conversations });
  },

  /** GET /api/chat/:id — Get conversation + messages */
  async get(req: Request, res: Response) {
    const studentId = await getStudentId(req.user!.userId);
    if (!studentId) return res.status(404).json({ error: "Profil élève introuvable" });

    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const result = await ChatService.getConversation(id, studentId);
    if (!result) return res.status(404).json({ error: "Conversation introuvable" });

    return res.json(result);
  },

  /** DELETE /api/chat/:id — Archive conversation */
  async archive(req: Request, res: Response) {
    const studentId = await getStudentId(req.user!.userId);
    if (!studentId) return res.status(404).json({ error: "Profil élève introuvable" });

    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const archived = await ChatService.archiveConversation(id, studentId);
    if (!archived) return res.status(404).json({ error: "Conversation introuvable" });

    return res.json({ conversation: archived });
  },

  /** POST /api/chat/:id/messages — Send message + stream AI response (SSE) */
  async sendMessage(req: Request, res: Response) {
    const studentId = await getStudentId(req.user!.userId);
    if (!studentId) return res.status(404).json({ error: "Profil élève introuvable" });

    const conversationId = parseInt(req.params.id as string, 10);
    if (isNaN(conversationId)) return res.status(400).json({ error: "ID invalide" });

    const parsed = sendMessageSchema.safeParse({
      conversationId,
      content: req.body.content,
      internal: req.body.internal,
    });
    if (!parsed.success) {
      return res.status(400).json({ error: "Message invalide", details: parsed.error.flatten() });
    }

    // Verify conversation belongs to student
    const conv = await ChatService.getConversation(conversationId, studentId);
    if (!conv) return res.status(404).json({ error: "Conversation introuvable" });

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    await ChatService.streamResponse(
      conversationId,
      studentId,
      parsed.data.content,
      { internal: req.body.internal === true },
      // onChunk: send each token as SSE data
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      },
      // onDone: signal end
      (_fullContent) => {
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      },
      // onError
      (error) => {
        res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
        res.end();
      }
    );
  },
};
