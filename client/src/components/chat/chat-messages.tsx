"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@notria/shared";
import { CourseFlowSwiper } from "@/components/chat/course-flow-swiper";

interface ChatMessagesProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  activeSubject?: string;
  activeTopic?: string;
  isCourseUnlocked?: boolean;
  onUnlockCourse?: () => void;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
  activeSubject,
  activeTopic,
  isCourseUnlocked,
  onUnlockCourse,
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
          {activeSubject ? (
            <div className="w-full max-w-4xl text-left">
              <CourseFlowSwiper
                subject={activeSubject}
                topic={activeTopic}
                unlocked={Boolean(isCourseUnlocked)}
                onUnlock={onUnlockCourse || (() => {})}
              />
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Prof Ada est prête !</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Crée ou sélectionne une conversation pour démarrer ton cours.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {visible.map((msg) => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
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

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-foreground/10" : "bg-primary/10"
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
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-base prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background/50 prose-pre:rounded-lg">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
        )}
      </div>
    </div>
  );
}
