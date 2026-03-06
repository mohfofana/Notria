"use client";

import { Shield, Award, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

type League = "Bronze" | "Argent" | "Or" | "Diamant";

const LEAGUE_CONFIG: Record<League, { icon: typeof Shield; bgClass: string; textClass: string }> = {
  Bronze: { icon: Shield, bgClass: "bg-amber-100", textClass: "text-amber-700" },
  Argent: { icon: Award, bgClass: "bg-slate-100", textClass: "text-slate-600" },
  Or: { icon: Crown, bgClass: "bg-yellow-100", textClass: "text-yellow-600" },
  Diamant: { icon: Gem, bgClass: "bg-cyan-100", textClass: "text-cyan-600" },
};

interface LevelBadgeProps {
  league: string;
  size?: "sm" | "md";
  className?: string;
}

export function LevelBadge({ league, size = "md", className }: LevelBadgeProps) {
  const config = LEAGUE_CONFIG[league as League] ?? LEAGUE_CONFIG.Bronze;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        config.bgClass,
        config.textClass,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      <span>{league}</span>
    </div>
  );
}
