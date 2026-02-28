"use client";

import { useState } from "react";
import { X, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTopicsForSubject } from "@notria/shared";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (topic?: string) => Promise<void>;
}

export function NewConversationDialog({ open, onClose, onCreate }: NewConversationDialogProps) {
  const { student } = useAuth();
  const [topic, setTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!open || !student) return null;

  const examType = student.examType === "BAC" ? "BAC" : "BEPC";
  const subject = "Mathématiques";
  const topics = getTopicsForSubject(subject, examType);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const finalTopic = customTopic.trim() || topic || undefined;
      await onCreate(finalTopic);
      setTopic(null);
      setCustomTopic("");
    } finally {
      setIsCreating(false);
    }
  }

  function handleClose() {
    setTopic(null);
    setCustomTopic("");
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
          <div>
            <p className="text-sm font-medium mb-2">Matière active</p>
            <div className="rounded-lg border-2 border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              Mathématiques
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Sujet libre <span className="text-muted-foreground font-normal">(optionnel)</span>
            </p>
            <Input
              placeholder="Ex: Calcul numérique, Pythagore, Fractions..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {topics.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Ou choisis un chapitre de maths
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
            disabled={isCreating}
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
