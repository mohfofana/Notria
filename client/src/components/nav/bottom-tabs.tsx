"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, GraduationCap, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/session/today", label: "Session", icon: BookOpen },
  { href: "/programme", label: "Programme", icon: GraduationCap },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/paiement", label: "Profil", icon: User },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="n-bottom-tabs md:hidden">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn("n-tab-item", active && "active")}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
