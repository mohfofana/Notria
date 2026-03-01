"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  GraduationCap,
  MessageCircle,
  ClipboardList,
  Camera,
  CreditCard,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const mainNav = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/session/today", label: "Session du jour", icon: BookOpen },
  { href: "/programme", label: "Mon programme", icon: GraduationCap },
  { href: "/chat", label: "Prof Ada", icon: MessageCircle },
];

const secondaryNav = [
  { href: "/examens", label: "Examens blancs", icon: ClipboardList },
  { href: "/notria-vision", label: "Notria Vision", icon: Camera },
  { href: "/homework/today", label: "Devoirs", icon: FileText },
  { href: "/paiement", label: "Abonnement", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="n-sidebar hidden md:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm">
          N
        </span>
        <span className="font-display text-lg font-bold text-foreground">
          Notria
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {mainNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("n-sidebar-item", active && "active")}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="my-3 h-px bg-border/60" />

        {secondaryNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("n-sidebar-item", active && "active")}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border/60 pt-3">
        {user && (
          <div className="mb-2 flex items-center gap-2.5 px-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
              {user.firstName[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.firstName}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className="n-sidebar-item w-full text-destructive hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Deconnexion</span>
        </button>
      </div>
    </aside>
  );
}
