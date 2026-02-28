"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@notria/shared";
import { ChalkBoardSequence, type BoardSequence } from "./chalk-board-sequence";

interface ChatMessagesProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  activeSubject?: string;
  activeTopic?: string;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
  activeSubject,
  activeTopic,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Filter out system messages
  const visible = messages.filter((m) => m.role !== "system");

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {visible.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
          <div className="h-20 w-20 rounded-2xl border-2 border-primary/20 bg-primary/5 grid place-items-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">
              {activeSubject ? `${activeSubject} ${activeTopic ? `• ${activeTopic}` : ""}` : "Prof Ada est prete"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {activeSubject
                ? "Pose ta premiere question pour demarrer la seance."
                : "Cree ou selectionne une conversation pour demarrer ton cours."}
            </p>
          </div>
        </div>
      )}

      {visible.map((msg, index) => (
        <MessageBubble
          key={`${msg.id}-${msg.createdAt}-${index}`}
          role={msg.role}
          content={msg.content}
        />
      ))}

      {isStreaming && streamingContent && (
        <MessageBubble role="assistant" content={streamingContent} isStreaming />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: string;
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";
  const allowBoard = !isUser && !isStreaming;
  const boardSequence = allowBoard ? extractBoardSequence(content) : null;
  const renderedContent = isUser
    ? content
    : stripBoardSequence(content)
        .replace(/(?:^|\n)\s*\[?\s*ETAPE\s*:[^\n\]]*\]?\s*/gi, "\n")
        .replace(/(?:^|\n)\s*Etape\s*\d+\s*[:\-]\s*[A-Z_ ]+\s*$/gim, "")
        .replace(/(?:^|\n)\s*(INTRO|EXPLAIN|CHECK|PRACTICE|RECAP)\s*$/gim, "")
        .replace(/(?:^|\n)\s*Choix\s*:\s*.+$/gim, "")
        .trim();
  const activeBoard = boardSequence;
  const showTextBlock = isUser ? true : !activeBoard;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-foreground/10" : "border border-primary/20 bg-primary/5"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-foreground/70" />
        ) : (
          <GraduationCap className="h-4 w-4 text-primary" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{renderedContent}</p>
        ) : (
          <>
            {showTextBlock && renderedContent ? (
              <div className="prose prose-sm max-w-none prose-headings:text-base prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background/50 prose-pre:rounded-lg">
                <ReactMarkdown>{renderedContent}</ReactMarkdown>
              </div>
            ) : null}
            {activeBoard ? <ChalkBoardSequence sequence={activeBoard} /> : null}
          </>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
        )}
      </div>
    </div>
  );
}

function stripBoardSequence(content: string): string {
  return content
    .replace(/```json\s*([\s\S]*?)```/gi, (block, jsonCandidate: string) => {
      try {
        const parsed = JSON.parse(jsonCandidate.trim()) as { type?: string };
        return parsed?.type === "board_sequence" ? "" : block;
      } catch {
        return block;
      }
    })
    .trim();
}

function extractBoardSequence(content: string): BoardSequence | null {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], content];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate.trim()) as BoardSequence;
      if (parsed?.type === "board_sequence" && Array.isArray(parsed.steps)) {
        return parsed;
      }
    } catch {
      // ignore malformed blocks
    }
  }

  return null;
}
