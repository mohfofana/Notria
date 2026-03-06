"use client";

import {
  Calculator,
  BookOpen,
  Leaf,
  Atom,
  Globe,
  Map,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectConfig {
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
  label: string;
}

const SUBJECT_MAP: Record<string, SubjectConfig> = {
  "Mathématiques": { icon: Calculator, bgClass: "bg-blue-100", textClass: "text-blue-700", label: "Maths" },
  "Mathematiques": { icon: Calculator, bgClass: "bg-blue-100", textClass: "text-blue-700", label: "Maths" },
  "Français": { icon: BookOpen, bgClass: "bg-purple-100", textClass: "text-purple-700", label: "Francais" },
  "Francais": { icon: BookOpen, bgClass: "bg-purple-100", textClass: "text-purple-700", label: "Francais" },
  "SVT": { icon: Leaf, bgClass: "bg-green-100", textClass: "text-green-700", label: "SVT" },
  "Physique-Chimie": { icon: Atom, bgClass: "bg-orange-100", textClass: "text-orange-700", label: "Physique" },
  "Anglais": { icon: Globe, bgClass: "bg-pink-100", textClass: "text-pink-700", label: "Anglais" },
  "Histoire-Géographie": { icon: Map, bgClass: "bg-yellow-100", textClass: "text-yellow-700", label: "Hist-Geo" },
  "Histoire-Geographie": { icon: Map, bgClass: "bg-yellow-100", textClass: "text-yellow-700", label: "Hist-Geo" },
};

const DEFAULT_CONFIG: SubjectConfig = {
  icon: BookOpen,
  bgClass: "bg-gray-100",
  textClass: "text-gray-700",
  label: "Matiere",
};

interface SubjectIconProps {
  subject: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function SubjectIcon({ subject, size = "md", showLabel = false, className }: SubjectIconProps) {
  const config = SUBJECT_MAP[subject] ?? DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center shrink-0",
          config.bgClass,
          size === "sm" && "w-8 h-8",
          size === "md" && "w-10 h-10",
          size === "lg" && "w-14 h-14"
        )}
      >
        <Icon
          className={cn(
            config.textClass,
            size === "sm" && "h-4 w-4",
            size === "md" && "h-5 w-5",
            size === "lg" && "h-7 w-7"
          )}
        />
      </div>
      {showLabel && (
        <span className={cn("font-medium", config.textClass, size === "sm" ? "text-xs" : "text-sm")}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export function getSubjectConfig(subject: string) {
  return SUBJECT_MAP[subject] ?? DEFAULT_CONFIG;
}
