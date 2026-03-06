"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  BookOpen,
  FileText,
  Camera,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/programme", icon: Calendar, label: "Programme" },
  { href: "/homework/today", icon: BookOpen, label: "Devoirs" },
  { href: "/examens", icon: FileText, label: "Examens" },
  { href: "/notria-vision", icon: Camera, label: "Vision" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col sidebar-bg text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white font-[var(--font-display)]">
            Notria
          </span>
        )}
      </div>

      {/* Prof Ada mini avatar */}
      <div className={cn("px-4 py-3 border-b border-white/10", collapsed && "px-2 py-3")}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-full bg-accent/20 flex items-center justify-center shrink-0 ring-2 ring-accent/30",
              collapsed ? "w-8 h-8" : "w-10 h-10"
            )}
          >
            <GraduationCap className={cn("text-accent", collapsed ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[11px] text-white/50">Ton tuteur</p>
              <p className="text-sm font-medium text-white truncate">Prof Ada</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-sidebar-accent" : ""
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-white/10 p-3">
        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent shrink-0">
              {user.firstName?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="text-white/40 hover:text-white/80 p-1 transition-colors"
              title="Deconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent">
              {user.firstName?.[0] ?? "U"}
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border-2 border-border flex items-center justify-center text-white/60 hover:text-white shadow-sm transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
