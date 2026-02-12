"use client";

import { useState } from "react";
import { X, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSubjectsForStudent, getTopicsForSubject } from "@notria/shared";
import { useAuth } from "@/contexts/auth-context";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: string, topic?: string) => Promise<void>;
}

export function NewConversationDialog({ open, onClose, onCreate }: NewConversationDialogProps) {
  const { student } = useAuth();
  const [subject, setSubject] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!open || !student) return null;

  const subjects = getSubjectsForStudent(
    student.examType as "BAC" | "BEPC",
    student.series as "A1" | "A2" | "C" | "D" | undefined
  );

  const examType = student.examType as "BAC" | "BEPC";
  const topics = subject ? getTopicsForSubject(subject, examType) : [];

  async function handleCreate() {
    if (!subject) return;
    setIsCreating(true);
    try {
      await onCreate(subject, topic || undefined);
      setSubject(null);
      setTopic(null);
    } finally {
      setIsCreating(false);
    }
  }

  function handleClose() {
    setSubject(null);
    setTopic(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-background rounded-2xl border shadow-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Nouvelle conversation</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Subject selection */}
          <div>
            <p className="text-sm font-medium mb-2">Choisis une matière</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSubject(s);
                    setTopic(null);
                  }}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    subject === s
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Topic selection (optional) */}
          {subject && topics.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Choisis un sujet <span className="text-muted-foreground font-normal">(optionnel)</span>
              </p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(topic === t ? null : t)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                      topic === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button
            onClick={handleCreate}
            disabled={!subject || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Commencer à discuter"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
