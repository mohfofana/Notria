"use client";

import Link from "next/link";
import { Flame, Bell } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function TopHeader() {
  const { user, student } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Mobile logo */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm">
            N
          </span>
          <span className="font-display text-base font-bold">Notria</span>
        </Link>

        {/* Desktop: empty left side (sidebar handles logo) */}
        <div className="hidden md:block" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          {student && (
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-secondary-foreground">
                {student.currentStreak}
              </span>
            </div>
          )}

          {/* Notifications */}
          <button className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Bell className="h-[18px] w-[18px]" />
          </button>

          {/* Avatar */}
          {user && (
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {user.firstName[0]}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
