"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakFireProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakFire({ streak, size = "md", className }: StreakFireProps) {
  const isActive = streak > 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-bold",
        size === "sm" && "text-xs gap-0.5",
        size === "md" && "text-sm",
        size === "lg" && "text-base gap-1.5",
        isActive ? "text-orange-500" : "text-muted-foreground",
        className
      )}
    >
      <Flame
        className={cn(
          "fill-current",
          isActive && "animate-fire",
          !isActive && "opacity-40",
          size === "sm" && "h-3.5 w-3.5",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-6 w-6"
        )}
      />
      <span>{streak}</span>
    </div>
  );
}
