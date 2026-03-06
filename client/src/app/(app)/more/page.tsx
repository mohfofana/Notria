"use client";

import Link from "next/link";
import {
  FileText,
  Camera,
  CreditCard,
  Trophy,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

const MORE_ITEMS = [
  { href: "/examens", icon: FileText, label: "Examens blancs", color: "bg-blue-100 text-blue-700" },
  { href: "/notria-vision", icon: Camera, label: "Notria Vision", color: "bg-purple-100 text-purple-700" },
  { href: "/paiement", icon: CreditCard, label: "Abonnement", color: "bg-emerald-100 text-emerald-700" },
];

export default function MorePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/connexion");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* User info */}
      {user && (
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center text-white text-xl font-bold">
            {user.firstName?.[0] ?? "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
          </div>
        </div>
      )}

      {/* Grid of actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {MORE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-center text-foreground">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Deconnexion</span>
      </button>
    </div>
  );
}
