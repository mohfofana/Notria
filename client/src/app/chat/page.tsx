"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowLeft, Menu, Mic, Camera, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { streamChat } from "@/lib/sse";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import type { Conversation, Message } from "@notria/shared";

function uniq(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function extractQuickReplies(content: string): string[] {
  const choices: string[] = [];
  const lineMatches = content.matchAll(/(?:^|\n)\s*Choix\s*:\s*(.+)$/gim);
  for (const match of lineMatches) {
    if (!match[1]) continue;
    choices.push(
      ...match[1]
        .split("|")
        .map((choice) => choice.replace(/^[-*]\s*/, "").trim())
        .filter((choice) => choice.length > 0)
    );
  }

  // Fallback parser: bullet list recommendations in assistant responses
  const bulletMatches = content.matchAll(/(?:^|\n)\s*[-*]\s+(.{3,120})$/gim);
  for (const match of bulletMatches) {
    const candidate = match[1]?.trim();
    if (candidate) choices.push(candidate);
  }

  return uniq(choices).slice(0, 6);
}

function extractAssistantQuestion(content: string): string | null {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const questionLine = [...lines].reverse().find((line) => line.includes("?"));
  return questionLine || null;
}

function extractEquation(content: string): string | null {
  const eqLine = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /=|√|\\sqrt|[a-zA-Z]\^2/.test(line));
  return eqLine || null;
}

function buildContextualReplies(params: {
  topic?: string;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  preferQuestionFlow?: boolean;
}): string[] {
  const normalizedUser = (params.lastUserMessage || "").toLowerCase();
  const assistant = params.lastAssistantMessage || "";
  const topic = params.topic?.trim();
  const question = extractAssistantQuestion(assistant);
  const equation = extractEquation(assistant);

  const replies: string[] = [];

  if (question && params.preferQuestionFlow) {
    replies.push("Je tente: ...");
    replies.push("Je ne suis pas sûr, aide-moi");
    replies.push("Peux-tu reformuler la question ?");
  }

  if (equation) {
    replies.push(`Explique cette ligne: ${equation}`);
    replies.push("Refais le calcul étape par étape");
  }

  if (topic) {
    replies.push(`On continue sur ${topic}`);
    replies.push(`Donne un exercice BEPC sur ${topic}`);
  }

  if (normalizedUser.includes("pas compris") || normalizedUser.includes("je comprends pas")) {
    replies.push("Reprends très lentement depuis le début");
    replies.push("Donne une analogie très simple");
  } else {
    replies.push("Donne un exemple concret");
    replies.push("Fais une vérification rapide");
    replies.push("Donne-moi un mini exercice");
    replies.push("Donne un indice sans la réponse");
    replies.push("Fais un résumé en 3 phrases");
  }

  return uniq(replies).slice(0, 6);
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autostartDone = useRef(false);
  const tempMessageIdRef = useRef(-1);
  const streamBufferRef = useRef("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const latestVisible = [...messages].reverse().find((msg) => msg.role !== "system");
  const latestUser = [...messages].reverse().find((msg) => msg.role === "user");
  const latestAssistant = latestVisible?.role === "assistant" ? latestVisible : null;
  const aiQuickReplies = isStreaming || !latestAssistant ? [] : extractQuickReplies(latestAssistant.content);
  const contextualReplies = latestAssistant
    ? buildContextualReplies({
        topic: activeConv?.topic,
        lastUserMessage: latestUser?.content,
        lastAssistantMessage: latestAssistant.content,
        preferQuestionFlow: aiQuickReplies.length > 0,
      })
    : [];
  const quickReplies =
    aiQuickReplies.length > 0
      ? uniq([...aiQuickReplies, ...contextualReplies]).slice(0, 6)
      : contextualReplies;

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/chat");
      setConversations(data.conversations || []);
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setActiveId(parseInt(idParam, 10));
    }
  }, [searchParams]);

  useEffect(() => {
    const currentId = activeId;
    if (!currentId) {
      setMessages([]);
      return;
    }

    async function load() {
      try {
        const { data } = await api.get(`/chat/${currentId}`);
        setMessages(data.messages);
      } catch {
        setMessages([]);
      }
    }
    load();
  }, [activeId]);

  const reloadActiveConversation = useCallback(async () => {
    if (!activeId) return;
    try {
      const { data } = await api.get(`/chat/${activeId}`);
      setMessages(data.messages || []);
    } catch {
      // Ignore refresh errors
    }
  }, [activeId]);

  // Auto-start: when coming from dashboard, send the first message automatically
  useEffect(() => {
    if (
      !autostartDone.current &&
      searchParams.get("autostart") === "1" &&
      activeId &&
      messages.length === 0 &&
      !isStreaming
    ) {
      const subjectFromQuery = searchParams.get("subject");
      const topicFromQuery = searchParams.get("topic");
      const conv = conversations.find((c) => c.id === activeId);
      const subject = subjectFromQuery || conv?.subject;
      const topic = topicFromQuery || conv?.topic;

      if (!subject) return;

      autostartDone.current = true;
      const prompt = topic
        ? `On commence une séance guidée sur ${topic} en ${subject}.`
        : `On commence une séance guidée en ${subject}.`;
      handleSend(prompt, { internal: true });
    }
  }, [activeId, messages, conversations, searchParams, isStreaming]);

  async function handleSend(content: string, options?: { internal?: boolean }) {
    if (!activeId || isStreaming) return;

    if (!options?.internal) {
      const tempUserId = tempMessageIdRef.current--;
      const tempUserMsg: Message = {
        id: tempUserId,
        conversationId: activeId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
    }
    setIsStreaming(true);
    setStreamingContent("");
    streamBufferRef.current = "";

    await streamChat(activeId, content, { internal: options?.internal === true }, {
      onChunk(chunk) {
        streamBufferRef.current += chunk;
        setStreamingContent((prev) => prev + chunk);
      },
      async onDone() {
        setStreamingContent("");
        streamBufferRef.current = "";
        setIsStreaming(false);
        loadConversations();
        await reloadActiveConversation();
      },
      onError(error) {
        console.error("Stream error:", error);
        setStreamingContent("");
        streamBufferRef.current = "";
        setIsStreaming(false);
      },
    });
  }

  async function handleCreate(topic?: string) {
    const { data } = await api.post("/chat", { subject: "Mathématiques", topic });
    setConversations((prev) => [data.conversation, ...prev]);
    setActiveId(data.conversation.id);
    setShowNewDialog(false);
    setSidebarOpen(false);
    setMessages([]);
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/chat/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      // Ignore
    }
  }

  function handleSelect(id: number) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  return (
    <div className="h-screen flex bg-background">
      <div className="hidden md:flex md:w-80 border-r flex-col">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={() => setShowNewDialog(true)}
          onDelete={handleDelete}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 h-full bg-background border-r">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelect}
              onNew={() => {
                setShowNewDialog(true);
                setSidebarOpen(false);
              }}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="hidden md:flex"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GraduationCap className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold truncate">
              {activeConv ? activeConv.title || activeConv.subject : "Prof Ada"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/notria-vision")}
            >
              <Camera className="h-4 w-4 mr-1" />
              Notria Vision
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/chat?voice=1")}
            >
              <Mic className="h-4 w-4 mr-1" />
              Vocal (MVP)
            </Button>
          </div>
        </header>

        <ChatMessages
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          activeSubject={activeConv?.subject}
          activeTopic={activeConv?.topic}
        />

        {activeId ? (
          <>
            <div className="border-t px-4 py-3 bg-muted/20">
              <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium truncate">
                    Session: {activeConv?.subject || "Mathématiques"}
                    {activeConv?.topic ? ` • ${activeConv.topic}` : ""}
                  </span>
                  <span className="text-muted-foreground">({messages.filter((m) => m.role !== "system").length} msgs)</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/session/today")}
                >
                  Voir la séance guidée
                </Button>
              </div>
            </div>
            {messages.length > 0 && quickReplies.length > 0 && (
              <div className="border-t px-4 pt-3">
                <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
                  <div className="w-full flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Réponses prêtes à envoyer
                  </div>
                  {quickReplies.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleSend(choice)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted max-w-full truncate"
                      title={choice}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ChatInput
              onSend={handleSend}
              isStreaming={isStreaming}
              placeholder="Écris comme si tu parlais à un prof..."
            />
          </>
        ) : (
          <div className="border-t px-4 py-8">
            <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                Comment Notria fonctionne
              </p>
              <h3 className="text-lg font-semibold mb-4">Une séance type en 4 étapes</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  "Cours guidé",
                  "Vérification rapide",
                  "Exercices BEPC",
                  "Correction + recap",
                ].map((step, idx) => (
                  <div key={step} className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Étape {idx + 1}</p>
                    <p className="mt-1 font-medium">{step}</p>
                    {idx < 3 && <ChevronRight className="h-4 w-4 mt-2 text-primary" />}
                  </div>
                ))}
              </div>
              <Button className="mt-5" onClick={() => setShowNewDialog(true)}>
                Démarrer une nouvelle conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
