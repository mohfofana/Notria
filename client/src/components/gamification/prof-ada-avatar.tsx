"use client";

import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Expression = "happy" | "thinking" | "celebrating" | "encouraging" | "neutral";

interface ProfAdaAvatarProps {
  expression?: Expression;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const ICON_SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const EXPRESSION_EMOJIS: Record<Expression, string> = {
  happy: "😊",
  thinking: "🤔",
  celebrating: "🎉",
  encouraging: "💪",
  neutral: "",
};

export function ProfAdaAvatar({
  expression = "neutral",
  size = "md",
  className,
}: ProfAdaAvatarProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/20",
          SIZE_CLASSES[size]
        )}
      >
        <GraduationCap className={cn("text-white", ICON_SIZES[size])} />
      </div>
      {expression !== "neutral" && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 text-xs",
            size === "xl" && "text-lg -bottom-2 -right-2",
            size === "lg" && "text-sm -bottom-1 -right-1"
          )}
        >
          {EXPRESSION_EMOJIS[expression]}
        </span>
      )}
    </div>
  );
}
