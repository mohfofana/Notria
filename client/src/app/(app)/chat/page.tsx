"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Menu, Mic, Camera, BookOpen, Sparkles } from "lucide-react";
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
    choices.push(...match[1].split("|").map((c) => c.replace(/^[-*]\s*/, "").trim()).filter(Boolean));
  }
  const bulletMatches = content.matchAll(/(?:^|\n)\s*[-*]\s+(.{3,120})$/gim);
  for (const match of bulletMatches) {
    const candidate = match[1]?.trim();
    if (candidate) choices.push(candidate);
  }
  return uniq(choices).slice(0, 6);
}

function extractAssistantQuestion(content: string): string | null {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  return [...lines].reverse().find((l) => l.includes("?")) || null;
}

function extractEquation(content: string): string | null {
  return content.split("\n").map((l) => l.trim()).find((l) => /=|√|\\sqrt|[a-zA-Z]\^2/.test(l)) || null;
}

function buildContextualReplies(p: { topic?: string; lastUserMessage?: string; lastAssistantMessage?: string; preferQuestionFlow?: boolean }): string[] {
  const assistant = p.lastAssistantMessage || "";
  const topic = p.topic?.trim();
  const question = extractAssistantQuestion(assistant);
  const equation = extractEquation(assistant);
  const replies: string[] = [];
  if (question && p.preferQuestionFlow) {
    replies.push("Je tente: ...", "Je ne suis pas sur, aide-moi", "Reformule la question");
  }
  if (equation) { replies.push(`Explique: ${equation}`, "Refais le calcul etape par etape"); }
  if (topic) { replies.push(`On continue sur ${topic}`, `Exercice BEPC sur ${topic}`); }
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
  const latestVisible = [...messages].reverse().find((m) => m.role !== "system");
  const latestUser = [...messages].reverse().find((m) => m.role === "user");
  const latestAssistant = latestVisible?.role === "assistant" ? latestVisible : null;
  const aiQuickReplies = isStreaming || !latestAssistant ? [] : extractQuickReplies(latestAssistant.content);
  const contextualReplies = latestAssistant
    ? buildContextualReplies({ topic: activeConv?.topic, lastUserMessage: latestUser?.content, lastAssistantMessage: latestAssistant.content, preferQuestionFlow: aiQuickReplies.length > 0 })
    : [];
  const quickReplies = aiQuickReplies.length > 0
    ? uniq([...aiQuickReplies, ...contextualReplies]).slice(0, 6)
    : contextualReplies;

  const loadConversations = useCallback(async () => {
    try { const { data } = await api.get("/chat"); setConversations(data.conversations || []); }
    catch { setConversations([]); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { const id = searchParams.get("id"); if (id) setActiveId(parseInt(id, 10)); }, [searchParams]);
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => { try { const { data } = await api.get(`/chat/${activeId}`); setMessages(data.messages); } catch { setMessages([]); } })();
  }, [activeId]);

  const reloadActiveConversation = useCallback(async () => {
    if (!activeId) return;
    try { const { data } = await api.get(`/chat/${activeId}`); setMessages(data.messages || []); } catch {}
  }, [activeId]);

  useEffect(() => {
    const hasStarted = messages.some((m) => m.role === "user" || m.role === "assistant");
    if (!autostartDone.current && searchParams.get("autostart") === "1" && activeId && !hasStarted && !isStreaming) {
      const conv = conversations.find((c) => c.id === activeId);
      const subject = searchParams.get("subject") || conv?.subject;
      const topic = searchParams.get("topic") || conv?.topic;
      if (!subject) return;
      autostartDone.current = true;
      handleSend(topic ? `On commence sur ${topic} en ${subject}.` : `On commence en ${subject}.`, { internal: true });
    }
  }, [activeId, messages, conversations, searchParams, isStreaming]);

  async function handleSend(content: string, opts?: { internal?: boolean }) {
    if (!activeId || isStreaming) return;
    if (!opts?.internal) {
      const tempId = tempMessageIdRef.current--;
      setMessages((prev) => [...prev, { id: tempId, conversationId: activeId, role: "user", content, createdAt: new Date().toISOString() }]);
    }
    setIsStreaming(true);
    setStreamingContent("");
    streamBufferRef.current = "";
    await streamChat(activeId, content, { internal: opts?.internal === true }, {
      onChunk(chunk) { streamBufferRef.current += chunk; setStreamingContent((p) => p + chunk); },
      async onDone() { setStreamingContent(""); streamBufferRef.current = ""; setIsStreaming(false); loadConversations(); await reloadActiveConversation(); },
      onError() { setStreamingContent(""); streamBufferRef.current = ""; setIsStreaming(false); },
    });
  }

  async function handleCreate(topic?: string) {
    const { data } = await api.post("/chat", { subject: "Mathematiques", topic });
    setConversations((prev) => [data.conversation, ...prev]);
    setActiveId(data.conversation.id);
    setShowNewDialog(false);
    setSidebarOpen(false);
    setMessages([]);
  }

  async function handleDelete(id: number) {
    try { await api.delete(`/chat/${id}`); setConversations((p) => p.filter((c) => c.id !== id)); if (activeId === id) { setActiveId(null); setMessages([]); } } catch {}
  }

  return (
    <div className="-mx-4 -my-5 md:-mx-6 md:-my-6 flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] gap-0 md:gap-3 md:p-3">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 flex-col rounded-2xl border border-border bg-card overflow-hidden">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
          onNew={() => setShowNewDialog(true)}
          onDelete={handleDelete}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full bg-card border-r border-border">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
              onNew={() => { setShowNewDialog(true); setSidebarOpen(false); }}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 md:rounded-2xl md:border md:border-border md:bg-card overflow-hidden">
        {/* Header */}
        <header className="border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-card/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-display text-xs font-bold">A</span>
            </div>
            <span className="font-semibold text-sm truncate">
              {activeConv ? activeConv.title || activeConv.subject : "Prof Ada"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => router.push("/notria-vision")}>
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          activeSubject={activeConv?.subject}
          activeTopic={activeConv?.topic}
        />

        {activeId ? (
          <>
            {/* Quick replies */}
            {messages.length > 0 && quickReplies.length > 0 && !isStreaming && (
              <div className="border-t border-border/50 px-4 py-2">
                <div className="max-w-3xl mx-auto flex flex-wrap gap-1.5">
                  {quickReplies.map((choice) => (
                    <button
                      key={choice}
                      onClick={() => handleSend(choice)}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary max-w-full truncate transition-colors"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ChatInput onSend={handleSend} isStreaming={isStreaming} placeholder="Ecris ta reponse ou ta question..." />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold mb-2">Discuter avec Prof Ada</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Pose tes questions, demande des explications ou des exercices BEPC.
              </p>
              <Button onClick={() => setShowNewDialog(true)} size="lg">
                Nouvelle conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      <NewConversationDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} onCreate={handleCreate} />
    </div>
  );
}
