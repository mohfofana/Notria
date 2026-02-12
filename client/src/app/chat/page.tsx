"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { streamChat } from "@/lib/sse";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import type { Conversation, Message } from "@notria/shared";

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
  const autostartDone = useRef(false);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/chat");
      setConversations(data.conversations);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle URL params: ?id=X&autostart=1 (from dashboard "Commencer" button)
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setActiveId(parseInt(idParam, 10));
    }
  }, [searchParams]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    async function load() {
      try {
        const { data } = await api.get(`/chat/${activeId}`);
        setMessages(data.messages);
      } catch {
        setMessages([]);
      }
    }
    load();
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
      autostartDone.current = true;
      // Find the conversation to get subject/topic
      const conv = conversations.find((c) => c.id === activeId);
      if (conv) {
        const prompt = conv.topic
          ? `Je veux étudier "${conv.topic}" en ${conv.subject}. Explique-moi ce chapitre étape par étape, puis donne-moi des exercices pour m'entraîner.`
          : `Je veux étudier ${conv.subject}. Explique-moi les notions importantes, puis donne-moi des exercices.`;
        handleSend(prompt);
      }
    }
  }, [activeId, messages, conversations, searchParams, isStreaming]);

  // Send message
  async function handleSend(content: string) {
    if (!activeId || isStreaming) return;

    const tempUserMsg: Message = {
      id: Date.now(),
      conversationId: activeId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent("");

    await streamChat(activeId, content, {
      onChunk(chunk) {
        setStreamingContent((prev) => prev + chunk);
      },
      onDone() {
        setStreamingContent((current) => {
          if (current) {
            const assistantMsg: Message = {
              id: Date.now() + 1,
              conversationId: activeId!,
              role: "assistant",
              content: current,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
          return "";
        });
        setIsStreaming(false);
        loadConversations();
      },
      onError(error) {
        console.error("Stream error:", error);
        setStreamingContent("");
        setIsStreaming(false);
      },
    });
  }

  // Create new conversation
  async function handleCreate(subject: string, topic?: string) {
    const { data } = await api.post("/chat", { subject, topic });
    setConversations((prev) => [data.conversation, ...prev]);
    setActiveId(data.conversation.id);
    setShowNewDialog(false);
    setSidebarOpen(false);
  }

  // Delete conversation
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

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex md:w-72 border-r flex-col">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={() => setShowNewDialog(true)}
          onDelete={handleDelete}
        />
      </div>

      {/* Sidebar - mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full bg-background border-r">
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

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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
        </header>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />

        {/* Input */}
        {activeId ? (
          <ChatInput onSend={handleSend} isStreaming={isStreaming} />
        ) : (
          <div className="border-t px-4 py-6 text-center">
            <Button onClick={() => setShowNewDialog(true)}>
              Nouvelle conversation
            </Button>
          </div>
        )}
      </div>

      {/* New conversation dialog */}
      <NewConversationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
