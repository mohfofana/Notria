"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowLeft, Menu, Mic, Camera, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { streamChat } from "@/lib/sse";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import { CourseSessionDemo } from "@/components/chat/course-session-demo";
import type { Conversation, Message } from "@notria/shared";

type CourseStarter = {
  id: string;
  subject: string;
  topic: string;
};

const COURSE_STARTERS: CourseStarter[] = [
  {
    id: "demo-fractions",
    subject: "Mathématiques",
    topic: "Fractions: addition et simplification",
  },
  {
    id: "demo-grammaire",
    subject: "Français",
    topic: "Accord du participe passé",
  },
  {
    id: "demo-histoire",
    subject: "Histoire-Géo",
    topic: "Indépendance de la Côte d'Ivoire",
  },
  {
    id: "demo-physique",
    subject: "Physique-Chimie",
    topic: "Circuits en série et en dérivation",
  },
];

const DEMO_DATE = "2026-02-21T08:00:00.000Z";

const DEMO_CONVERSATIONS: Conversation[] = COURSE_STARTERS.map((starter, index) => ({
  id: -(index + 1),
  studentId: 0,
  subject: starter.subject,
  topic: starter.topic,
  title: `${starter.subject} - ${starter.topic}`,
  isActive: true,
  createdAt: DEMO_DATE,
  updatedAt: DEMO_DATE,
}));

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courseUnlockedByConversation, setCourseUnlockedByConversation] = useState<Record<number, boolean>>({});

  const allConversations = [...conversations, ...DEMO_CONVERSATIONS];

  const activeConv = allConversations.find((c) => c.id === activeId) || null;
  const hasMessages = messages.length > 0;
  const needsCourseUnlock = Boolean(activeId && !hasMessages && !courseUnlockedByConversation[activeId]);
  const showDemoCourse = Boolean(activeConv && activeConv.id < 0 && !hasMessages);

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

    if (currentId < 0) {
      setMessages([]);
      return;
    }

    const resolvedId = currentId as number;

    async function load() {
      try {
        const { data } = await api.get(`/chat/${resolvedId}`);
        setMessages(data.messages);
        if ((data.messages || []).length > 0) {
          setCourseUnlockedByConversation((prev) => ({ ...prev, [resolvedId]: true }));
        }
      } catch {
        setMessages([]);
      }
    }
    load();
  }, [activeId]);

  async function ensureRealConversationId(id: number): Promise<number> {
    if (id > 0) return id;

    const demoConv = DEMO_CONVERSATIONS.find((conv) => conv.id === id);
    if (!demoConv) return id;

    const { data } = await api.post("/chat", {
      subject: demoConv.subject,
      topic: demoConv.topic,
    });

    const created: Conversation = data.conversation;
    setConversations((prev) => [created, ...prev]);
    setActiveId(created.id);
    setCourseUnlockedByConversation((prev) => ({ ...prev, [created.id]: true }));
    return created.id;
  }

  async function handleSend(content: string) {
    if (!activeId || isStreaming || needsCourseUnlock) return;

    const targetConversationId = await ensureRealConversationId(activeId);
    if (targetConversationId < 0) return;

    const tempUserMsg: Message = {
      id: Date.now(),
      conversationId: targetConversationId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent("");

    await streamChat(targetConversationId, content, {
      onChunk(chunk) {
        setStreamingContent((prev) => prev + chunk);
      },
      onDone() {
        setStreamingContent((current) => {
          if (current) {
            const assistantMsg: Message = {
              id: Date.now() + 1,
              conversationId: targetConversationId,
              role: "assistant",
              content: current,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
          return "";
        });
        setIsStreaming(false);
        setCourseUnlockedByConversation((prev) => ({ ...prev, [targetConversationId]: true }));
        loadConversations();
      },
      onError(error) {
        console.error("Stream error:", error);
        setStreamingContent("");
        setIsStreaming(false);
      },
    });
  }

  async function handleCreate(subject: string, topic?: string) {
    const { data } = await api.post("/chat", { subject, topic });
    setConversations((prev) => [data.conversation, ...prev]);
    setActiveId(data.conversation.id);
    setCourseUnlockedByConversation((prev) => ({ ...prev, [data.conversation.id]: false }));
    setShowNewDialog(false);
    setSidebarOpen(false);
    setMessages([]);
  }

  async function handleDelete(id: number) {
    if (id < 0) return;

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

  function handleStartCourse(starter: CourseStarter) {
    const target = DEMO_CONVERSATIONS.find((conv) => conv.topic === starter.topic && conv.subject === starter.subject);
    if (!target) return;
    setActiveId(target.id);
    setMessages([]);
    setSidebarOpen(false);
  }

  return (
    <div className="h-screen flex bg-background">
      <div className="hidden md:flex md:w-80 border-r flex-col">
        <ChatSidebar
          conversations={allConversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={() => setShowNewDialog(true)}
          onDelete={handleDelete}
          starters={COURSE_STARTERS}
          onStartCourse={handleStartCourse}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 h-full bg-background border-r">
            <ChatSidebar
              conversations={allConversations}
              activeId={activeId}
              onSelect={handleSelect}
              onNew={() => {
                setShowNewDialog(true);
                setSidebarOpen(false);
              }}
              onDelete={handleDelete}
              starters={COURSE_STARTERS}
              onStartCourse={handleStartCourse}
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

        {showDemoCourse ? (
          <CourseSessionDemo
            subject={activeConv?.subject || "Mathématiques"}
            topic={activeConv?.topic}
            unlocked={Boolean(activeId && courseUnlockedByConversation[activeId])}
            onUnlock={() => {
              if (!activeId) return;
              const currentId = activeId;
              setCourseUnlockedByConversation((prev) => ({ ...prev, [currentId]: true }));
            }}
          />
        ) : (
          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            activeSubject={activeConv?.subject}
            activeTopic={activeConv?.topic}
            isCourseUnlocked={Boolean(activeId && courseUnlockedByConversation[activeId])}
            onUnlockCourse={() => {
              if (!activeId) return;
              const currentId = activeId;
              setCourseUnlockedByConversation((prev) => ({ ...prev, [currentId]: true }));
            }}
          />
        )}

        {activeId ? (
          <ChatInput
            onSend={handleSend}
            isStreaming={isStreaming}
            disabled={needsCourseUnlock}
            placeholder={
              needsCourseUnlock
                ? "Lis d'abord le mini-cours (swipe), puis débloque les questions."
                : "Écris ta question sur le cours..."
            }
          />
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
