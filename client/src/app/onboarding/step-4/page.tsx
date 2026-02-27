"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarDays, Clock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getNextOnboardingPath } from "@/lib/onboarding";

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

const START_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

const DURATION_OPTIONS = [
  { value: "30", label: "30 min", description: "Session courte" },
  { value: "45", label: "45 min", description: "Session moyenne" },
  { value: "60", label: "1 heure", description: "Session longue" },
];

export default function OnboardingStep4() {
  const { student, refreshMe } = useAuth();
  const router = useRouter();

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("17:00");
  const [duration, setDuration] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedDays.length === 0) {
      setError("Choisis au moins un jour");
      return;
    }
    if (!duration) {
      setError("Choisis une durée de session");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/schedules/setup", {
        daysOfWeek: selectedDays,
        startTime,
        durationMinutes: duration,
      });
      await refreshMe();
      const next = getNextOnboardingPath({ student, hasSchedule: true });
      router.push(next);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ton emploi du temps</h1>
        <p className="text-muted-foreground mt-1">
          Quand veux-tu étudier avec Prof Ada ?
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Jours d'étude</h2>
        </div>
        <div className="flex gap-2">
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/40"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Heure de début</h2>
        </div>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none"
        >
          {START_TIMES.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Durée de chaque session</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDuration(option.value)}
              disabled={isSubmitting}
              className={`rounded-xl border-2 p-4 text-center transition-colors ${
                duration === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="text-lg font-bold">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || selectedDays.length === 0 || !duration}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Configuration...
          </>
        ) : (
          "Commencer à étudier"
        )}
      </Button>
    </form>
  );
}
