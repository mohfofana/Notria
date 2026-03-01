"use client";

import { useEffect, useMemo, useState } from "react";
import { X, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSubjectsForStudent, getTopicsForSubject } from "@notria/shared";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { subject: string; topic?: string }) => Promise<void>;
}

export function NewConversationDialog({ open, onClose, onCreate }: NewConversationDialogProps) {
  const { student } = useAuth();
  const examType = student?.examType === "BAC" ? "BAC" : "BEPC";
  const subjects = useMemo(() => {
    if (!student) return [];
    const preferred = Array.isArray(student.prioritySubjects) ? student.prioritySubjects : [];
    if (preferred.length > 0) return preferred;
    return getSubjectsForStudent(examType, undefined);
  }, [student, examType]);

  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && !subject) {
      setSubject(subjects[0] || "Mathématiques");
    }
  }, [subjects, subject]);

  if (!open || !student) return null;

  const topics = getTopicsForSubject(subject, examType);

  async function handleCreate() {
    if (!subject) return;
    setIsCreating(true);
    try {
      const finalTopic = customTopic.trim() || topic || undefined;
      await onCreate({ subject, topic: finalTopic });
      setTopic(null);
      setCustomTopic("");
      setSubject(subjects[0] || "");
    } finally {
      setIsCreating(false);
    }
  }

  function handleClose() {
    setTopic(null);
    setCustomTopic("");
    setSubject(subjects[0] || "");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-background rounded-2xl border shadow-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Nouvelle conversation</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Matiere</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    setSubject(entry);
                    setTopic(null);
                  }}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    subject === entry
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                  disabled={isCreating}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Sujet libre <span className="text-muted-foreground font-normal">(optionnel)</span>
            </p>
            <Input
              placeholder={`Ex: ${subject === "Français" ? "Conjugaison, Dictée, Résumé" : subject === "SVT" ? "Cellule, Nutrition, Reproduction" : subject === "Physique-Chimie" ? "Électricité, Optique, Solutions" : "Pythagore, Fractions, Calcul numérique"}`}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {topics.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Ou choisis un chapitre
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
            disabled={isCreating || !subject}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creation...
              </>
            ) : (
              "Commencer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
