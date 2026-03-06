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
          <div className="h-20 w-20 rounded-2xl bg-primary grid place-items-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">
              {activeSubject ? `${activeSubject} ${activeTopic ? `• ${activeTopic}` : ""}` : "Prof Ada est prete"}
            </h2>
            <p className="text-base text-muted-foreground max-w-sm">
              {activeSubject
                ? "Pose ta premiere question pour demarrer."
                : "Choisis une conversation pour commencer."}
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
  const cleanedContent = isUser
    ? content
    : stripBoardSequence(content)
        .replace(/(?:^|\n)\s*\[?\s*ETAPE\s*:[^\n\]]*\]?\s*/gi, "\n")
        .replace(/(?:^|\n)\s*Etape\s*\d+\s*[:\-]\s*[A-Z_ ]+\s*$/gim, "")
        .replace(/(?:^|\n)\s*(INTRO|EXPLAIN|CHECK|PRACTICE|RECAP)\s*$/gim, "")
        .replace(/(?:^|\n)\s*Choix\s*:\s*.+$/gim, "")
        .trim();
  const { body, references, confidence } = isUser
    ? { body: cleanedContent, references: [] as string[], confidence: null as string | null }
    : splitReferences(cleanedContent);
  const activeBoard = boardSequence;
  const showTextBlock = isUser ? true : !activeBoard;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-accent/15" : "bg-primary"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-accent" />
        ) : (
          <GraduationCap className="h-4 w-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
          isUser
            ? "bg-accent text-white"
            : "bg-white border border-border shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{body}</p>
        ) : (
          <>
            {showTextBlock && body ? (
              <div className="prose prose-sm max-w-none prose-headings:text-base prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background/50 prose-pre:rounded-lg">
                <ReactMarkdown>{body}</ReactMarkdown>
              </div>
            ) : null}
            {!isUser && references.length > 0 && (
              <div className="mt-3 rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  References
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {references.map((ref) => (
                    <li key={ref}>• {ref}</li>
                  ))}
                </ul>
                {confidence && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Fiabilite estimee: <span className="font-medium">{confidence}</span>
                  </p>
                )}
              </div>
            )}
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

function splitReferences(content: string): { body: string; references: string[]; confidence: string | null } {
  const refHeaderRegex = /\nReferences utilisees:\n/i;
  const match = content.match(refHeaderRegex);
  if (!match || match.index === undefined) {
    const legacyMatch = content.match(/\nSources:\s*(.+)(?:\n|$)/i);
    const legacyConfidence = content.match(/\nConfiance RAG:\s*([0-9.]+)/i);
    if (!legacyMatch || legacyMatch.index === undefined) {
      return { body: content, references: [], confidence: null };
    }
    const body = content.slice(0, legacyMatch.index).trim();
    const references = legacyMatch[1]
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    const confidence = legacyConfidence ? legacyConfidence[1] : null;
    return { body, references, confidence };
  }

  const body = content.slice(0, match.index).trim();
  const footer = content.slice(match.index + match[0].length).trim();
  const lines = footer.split("\n").map((line) => line.trim()).filter(Boolean);
  const references = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-+\s*/, "").trim());
  const confidenceLine = lines.find((line) => /^Fiabilite estimee:/i.test(line));
  const confidence = confidenceLine
    ? confidenceLine.replace(/^Fiabilite estimee:\s*/i, "").trim()
    : null;

  return { body, references, confidence };
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
