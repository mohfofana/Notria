"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Shield, Users } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminOverview {
  users: number;
  students: number;
  parents: number;
  activeConversations: number;
  messages: number;
  sessionsLast7Days: number;
  roleBreakdown: Record<string, number>;
}

interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: "student" | "parent" | "admin";
  isActive: boolean;
  createdAt: string;
}

interface AdminActivity {
  recentSessions: Array<{
    id: number;
    studentId: number;
    subject: string;
    durationMinutes: number;
    score: number | null;
    createdAt: string;
  }>;
  recentConversations: Array<{
    id: number;
    studentId: number;
    subject: string;
    topic: string | null;
    updatedAt: string;
  }>;
}

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<AdminActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || user?.role !== "admin") return;

    async function loadAdminData() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, usersRes, activityRes] = await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/users?limit=40"),
          api.get("/admin/activity?limit=10"),
        ]);
        setOverview(overviewRes.data.data);
        setUsers(usersRes.data.data ?? []);
        setActivity(activityRes.data.data);
      } catch {
        setError("Impossible de charger les donnees admin.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [isLoading, isAuthenticated, user]);

  async function toggleUserStatus(entry: AdminUser) {
    try {
      await api.patch(`/admin/users/${entry.id}/status`, { isActive: !entry.isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === entry.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch {
      // keep current state if action fails
    }
  }

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-base text-muted-foreground">Chargement de l'espace admin...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Espace admin Notria</h1>
          <p className="text-base text-muted-foreground">Vue globale des comptes et de l'activite.</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Badge>
      </div>

      {error && (
        <Card className="soft-card rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="soft-card rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Utilisateurs</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{overview.users}</CardContent>
          </Card>
          <Card className="soft-card rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Eleves / Parents</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{overview.students} / {overview.parents}</CardContent>
          </Card>
          <Card className="soft-card rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Conversations actives</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{overview.activeConversations}</CardContent>
          </Card>
          <Card className="soft-card rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Messages</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{overview.messages}</CardContent>
          </Card>
          <Card className="soft-card rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Sessions (7 jours)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{overview.sessionsLast7Days}</CardContent>
          </Card>
          <Card className="soft-card rounded-2xl">
            <CardHeader><CardTitle className="text-lg">Roles</CardTitle></CardHeader>
            <CardContent className="text-base text-muted-foreground">
              {Object.entries(overview.roleBreakdown).map(([role, count]) => (
                <p key={role}>{role}: {count}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shell rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Gestion des comptes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/80 bg-white/70 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{entry.firstName} {entry.lastName}</p>
                    <p className="text-sm text-muted-foreground">{entry.phone} • {entry.role}</p>
                  </div>
                <Button
                  size="sm"
                  variant={entry.isActive ? "outline" : "default"}
                  onClick={() => toggleUserStatus(entry)}
                >
                  {entry.isActive ? "Desactiver" : "Activer"}
                </Button>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>}
          </CardContent>
        </Card>

        <Card className="soft-shell rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activite recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Sessions
              </p>
              <div className="space-y-2">
                {(activity?.recentSessions || []).slice(0, 5).map((session) => (
                  <div key={session.id} className="rounded-md border border-border/80 bg-white/70 p-2 text-sm">
                    {session.subject} • {session.durationMinutes} min • score {session.score ?? "-"}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Conversations
              </p>
              <div className="space-y-2">
                {(activity?.recentConversations || []).slice(0, 5).map((conv) => (
                  <div key={conv.id} className="rounded-md border border-border/80 bg-white/70 p-2 text-sm">
                    {conv.subject}{conv.topic ? ` • ${conv.topic}` : ""}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
