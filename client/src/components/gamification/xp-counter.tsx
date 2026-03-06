"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPCounterProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function XPCounter({ value, size = "md", className }: XPCounterProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full accent-gradient text-white font-bold shadow-sm",
        size === "sm" && "px-2 py-0.5 text-xs gap-1",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-1.5 text-base",
        className
      )}
    >
      <Star
        className={cn(
          "fill-current",
          size === "sm" && "h-3 w-3",
          size === "md" && "h-4 w-4",
          size === "lg" && "h-5 w-5"
        )}
      />
      <span>{value.toLocaleString()}</span>
      <span className="font-medium opacity-80">XP</span>
    </div>
  );
}
