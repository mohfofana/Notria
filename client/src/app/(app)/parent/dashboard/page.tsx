"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, CheckCircle, Clock, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface ParentDashboardStudent {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    examType: string;
    targetScore: number | null;
  };
  stats: {
    currentStreak: number;
    recentSessions: number;
    homeworkCompleted: boolean;
  };
  recentActivity: Array<{
    id: number;
    subject: string;
    durationMinutes: number;
    score: number | null;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>;
  weeklyTimeline: Array<{
    id: number;
    day: string;
    subject: string;
    minutes: number;
    score: number | null;
  }>;
  weaknessActions: Array<{
    topic: string;
    misses: number;
    action: string;
  }>;
}

interface ParentDashboardResponse {
  success: boolean;
  data: ParentDashboardStudent[];
}

export default function ParentDashboardPage() {
  const { user, parent, linkedStudents, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ParentDashboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => dashboard.flatMap((entry) => entry.notifications).filter((n) => !n.read).length,
    [dashboard]
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/connexion");
      return;
    }
    if (user?.role !== "parent") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  async function loadDashboard(showSpinner = false) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const response = await api.get<ParentDashboardResponse>("/parent/dashboard");
      setDashboard(response.data.data || []);
    } catch {
      setError("Impossible de charger le dashboard parent.");
      if (showSpinner) setDashboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isLoading || !isAuthenticated || user?.role !== "parent") return;
    loadDashboard(true);
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Chargement du suivi parent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Espace parent</h1>
          <p className="text-base text-muted-foreground mt-1">
            Suivi simple de {dashboard.length > 1 ? "vos enfants" : "votre enfant"}
          </p>
          {parent?.inviteCode && (
            <p className="text-sm mt-2">
              Votre code de liaison: <span className="font-semibold tracking-wider">{parent.inviteCode}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">{linkedStudents.length} enfant(s) lie(s)</Badge>
          <Badge variant="outline" className="text-sm">{unreadCount} notification(s) non lue(s)</Badge>
          <Button variant="outline" size="sm" onClick={() => loadDashboard(false)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {error && (
        <Card className="soft-card rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {dashboard.length === 0 && !error && (
        <Card className="soft-card rounded-2xl">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Aucun enfant lie</h2>
            <p className="text-base text-muted-foreground mt-1">
              Relie un compte eleve pour voir l'activite et les progres.
            </p>
          </CardContent>
        </Card>
      )}

      {dashboard.map((studentData) => (
        <div key={studentData.student.id} className="space-y-5">
          <Card className="soft-shell rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl">
                    {studentData.student.firstName} {studentData.student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {studentData.student.examType} • Objectif: {studentData.student.targetScore ?? "-"} / 20
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">{studentData.stats.currentStreak} jours de serie</Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="soft-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Chiffres cles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-base">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serie</span>
                  <span className="font-medium">{studentData.stats.currentStreak} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions (7j)</span>
                  <span className="font-medium">{studentData.stats.recentSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Devoirs</span>
                  <span className={`font-medium ${studentData.stats.homeworkCompleted ? "text-green-600" : "text-amber-600"}`}>
                    {studentData.stats.homeworkCompleted ? "Termines" : "En cours"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="soft-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Activite recente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentData.recentActivity.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="rounded-lg border bg-muted/40 p-2 text-base">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{activity.subject}</span>
                      <span className="text-xs text-muted-foreground">{activity.durationMinutes} min</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score: {activity.score ?? "-"} / 100
                    </p>
                  </div>
                ))}
                {studentData.recentActivity.length === 0 && (
                  <p className="text-base text-muted-foreground">Aucune activite recente.</p>
                )}
              </CardContent>
            </Card>

            <Card className="soft-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentData.notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-2 text-base ${
                      notification.read ? "bg-muted/30" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <p>{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
                {studentData.notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune notification.</p>
                )}
                {studentData.notifications.some((n) => !n.read) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={async () => {
                      await api.post("/parent/notifications/read", { notificationId: "all" });
                      await loadDashboard(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Marquer comme lu
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="soft-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Timeline hebdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentData.weeklyTimeline.length > 0 ? (
                  studentData.weeklyTimeline.map((item) => (
                    <div key={item.id} className="rounded-lg border p-2 text-sm">
                      <p className="font-medium">{item.day} • {item.subject}</p>
                      <p className="text-muted-foreground">{item.minutes} min • score {item.score ?? "-"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Pas encore de sessions cette semaine.</p>
                )}
              </CardContent>
            </Card>

            <Card className="soft-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Faiblesses et actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentData.weaknessActions.length > 0 ? (
                  studentData.weaknessActions.map((item) => (
                    <div key={`${item.topic}-${item.action}`} className="rounded-lg border p-2 text-sm">
                      <p className="font-medium">{item.topic} ({item.misses} erreurs)</p>
                      <p className="text-muted-foreground">{item.action}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune faiblesse critique detectee.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
