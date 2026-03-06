"use client";

import { Check, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MissionCardProps {
  label: string;
  current: number;
  target: number;
  reward: number;
  completed?: boolean;
  className?: string;
}

export function MissionCard({
  label,
  current,
  target,
  reward,
  completed = false,
  className,
}: MissionCardProps) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 transition-all",
        completed && "bg-emerald-50/50 border-emerald-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            completed ? "bg-emerald-100" : "bg-accent/10"
          )}
        >
          {completed ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Target className="h-4 w-4 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", completed && "line-through text-muted-foreground")}>
            {label}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Progress
              value={progress}
              className="h-1.5 flex-1"
              indicatorClassName={completed ? "bg-emerald-500" : "bg-accent"}
            />
            <span className="text-[11px] text-muted-foreground shrink-0">
              {current}/{target}
            </span>
          </div>
        </div>
        <div className="text-xs font-bold text-accent shrink-0">+{reward} pts</div>
      </div>
    </div>
  );
}
