"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, RefreshCw, Shield, Users } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminOverview {
  users: number;
  students: number;
  parents: number;
  activeConversations: number;
  messages: number;
  sessionsLast7Days: number;
  activeStudentsLast7Days: number;
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
    studentName: string;
    subject: string;
    durationMinutes: number;
    score: number | null;
    createdAt: string;
  }>;
  recentConversations: Array<{
    id: number;
    studentId: number;
    studentName: string;
    subject: string;
    topic: string | null;
    updatedAt: string;
  }>;
}

interface AdminAIMetricsResponse {
  success: boolean;
  data: {
    snapshot: {
      totals: {
        calls: number;
        successes: number;
        fallbacks: number;
        qualityEvents: number;
        fallbackRate: number;
      };
      prompts: Array<{
        promptId: string;
        version: string;
        calls: number;
        fallbackRate: number;
        avgLatencyMs: number;
      }>;
    };
    alerts: Array<{
      type: string;
      prompt: string;
      fallbackRate: number;
      calls: number;
    }>;
  };
}

interface RagCoverageResponse {
  success: boolean;
  data: {
    rawDocuments: number;
    indexedChunks: number;
    subjectCoverage?: Array<{ subject: string; documents: number }>;
    indexedBySubject?: Array<{ subject: string; chunks: number }>;
    chapterCoverage: Array<{ chapter: string; documents: number }>;
  };
}

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<AdminActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AdminAIMetricsResponse["data"] | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "parent" | "admin">("all");
  const [ragCoverage, setRagCoverage] = useState<RagCoverageResponse["data"] | null>(null);

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

  async function loadAdminData(showSpinner = false) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const usersParams = new URLSearchParams();
      usersParams.set("limit", "40");
      if (search.trim().length > 0) usersParams.set("search", search.trim());
      if (roleFilter !== "all") usersParams.set("role", roleFilter);

      const [overviewRes, usersRes, activityRes] = await Promise.all([
        api.get("/admin/overview"),
        api.get(`/admin/users?${usersParams.toString()}`),
        api.get("/admin/activity?limit=10"),
      ]);
      const aiMetricsRes = await api.get<AdminAIMetricsResponse>("/admin/ai-metrics");
      const ragCoverageRes = await api.get<RagCoverageResponse>("/rag/coverage");
      setOverview(overviewRes.data.data);
      setUsers(usersRes.data.data ?? []);
      setActivity(activityRes.data.data);
      setAiMetrics(aiMetricsRes.data.data);
      setRagCoverage(ragCoverageRes.data.data);
    } catch {
      setError("Impossible de charger les donnees admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isLoading || !isAuthenticated || user?.role !== "admin") return;
    loadAdminData(true);
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    if (loading || !isAuthenticated || user?.role !== "admin") return;
    loadAdminData(false);
  }, [search, roleFilter]);

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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Badge>
          <Button variant="outline" size="sm" onClick={() => loadAdminData(false)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="soft-shell rounded-2xl">
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Recherche nom, prenom ou telephone"
            />
            <div className="flex flex-wrap gap-2">
              {(["all", "student", "parent", "admin"] as const).map((role) => (
                <Button
                  key={role}
                  type="button"
                  size="sm"
                  variant={roleFilter === role ? "default" : "outline"}
                  onClick={() => setRoleFilter(role)}
                >
                  {role === "all" ? "Tous" : role}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground self-center">
              {users.length} utilisateur(s) affiche(s)
            </p>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams();
                if (search.trim()) params.set("search", search.trim());
                if (roleFilter !== "all") params.set("role", roleFilter);
                window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/admin/users/export.csv?${params.toString()}`, "_blank");
              }}
            >
              Export CSV utilisateurs
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <CardHeader><CardTitle className="text-lg">Eleves actifs (7 jours)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{overview.activeStudentsLast7Days}</CardContent>
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

      {aiMetrics && (
        <Card className="soft-card rounded-2xl">
          <CardHeader>
            <CardTitle>Fiabilite IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4 text-sm">
              <p>Appels: <strong>{aiMetrics.snapshot.totals.calls}</strong></p>
              <p>Fallbacks: <strong>{aiMetrics.snapshot.totals.fallbacks}</strong></p>
              <p>Taux fallback: <strong>{Math.round(aiMetrics.snapshot.totals.fallbackRate * 100)}%</strong></p>
              <p>Qualite KO: <strong>{aiMetrics.snapshot.totals.qualityEvents}</strong></p>
            </div>
            {aiMetrics.alerts.length > 0 ? (
              <div className="space-y-2">
                {aiMetrics.alerts.map((alert) => (
                  <div key={`${alert.prompt}-${alert.type}`} className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm">
                    Alerte {alert.prompt}: fallback {Math.round(alert.fallbackRate * 100)}% ({alert.calls} appels)
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune alerte IA pour le moment.</p>
            )}
          </CardContent>
        </Card>
      )}

      {ragCoverage && (
        <Card className="soft-card rounded-2xl">
          <CardHeader>
            <CardTitle>Couverture RAG BEPC (multi-matières)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Documents bruts: <strong>{ragCoverage.rawDocuments}</strong> • Chunks indexes: <strong>{ragCoverage.indexedChunks}</strong></p>
            {Array.isArray(ragCoverage.subjectCoverage) && ragCoverage.subjectCoverage.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Par matière (documents)</p>
                {ragCoverage.subjectCoverage.slice(0, 6).map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between rounded border p-2">
                    <span>{subject.subject}</span>
                    <strong>{subject.documents}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1">
              {ragCoverage.chapterCoverage.slice(0, 8).map((chapter) => (
                <div key={chapter.chapter} className="flex items-center justify-between rounded border p-2">
                  <span>{chapter.chapter}</span>
                  <strong>{chapter.documents}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                    <p className="font-medium">{session.studentName}</p>
                    <p>{session.subject} • {session.durationMinutes} min • score {session.score ?? "-"}</p>
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
                    <p className="font-medium">{conv.studentName}</p>
                    <p>{conv.subject}{conv.topic ? ` • ${conv.topic}` : ""}</p>
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
