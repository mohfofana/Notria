"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, Clock, BookOpen, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface StudentStats {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    examType: string;
    targetScore: number;
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
    score: number;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>;
}

export default function ParentDashboard() {
  const [dashboard, setDashboard] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/parent/dashboard");
      setDashboard(response.data);
    } catch (error) {
      console.error("Failed to load parent dashboard:", error);
      // Mock data for demo
      setDashboard([
        {
          student: {
            id: 1,
            firstName: "Fatou",
            lastName: "Diallo",
            examType: "BAC",
            targetScore: 14,
          },
          stats: {
            currentStreak: 5,
            recentSessions: 4,
            homeworkCompleted: true,
          },
          recentActivity: [
            {
              id: 1,
              subject: "Mathématiques",
              durationMinutes: 45,
              score: 85,
              createdAt: new Date().toISOString(),
            },
            {
              id: 2,
              subject: "SVT",
              durationMinutes: 40,
              score: 92,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
          notifications: [
            {
              id: "1",
              type: "session_completed",
              message: "Fatou a terminé sa séance Maths - Score: 85/100",
              createdAt: new Date().toISOString(),
              read: false,
            },
            {
              id: "2",
              type: "homework_completed",
              message: "Fatou a terminé ses devoirs du jour !",
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement du suivi parental...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Suivi de {dashboard.length > 1 ? "vos enfants" : "votre enfant"}</h1>
        <p className="text-muted-foreground mt-2">
          Suivez les progrès et l'activité de vos enfants sur Notria
        </p>
      </div>

      {dashboard.map((studentData) => (
        <div key={studentData.student.id} className="space-y-6">
          {/* Student Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl">
                    {studentData.student.firstName} {studentData.student.lastName}
                  </h2>
                  <p className="text-muted-foreground">
                    Préparation {studentData.student.examType} - Objectif: {studentData.student.targetScore}/20
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Série: {studentData.stats.currentStreak} jours
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Série actuelle</span>
                  <span className="font-semibold">{studentData.stats.currentStreak} jours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Séances cette semaine</span>
                  <span className="font-semibold">{studentData.stats.recentSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Devoirs aujourd'hui</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    studentData.stats.homeworkCompleted ? "text-green-600" : "text-orange-600"
                  }`}>
                    {studentData.stats.homeworkCompleted ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Terminés
                      </>
                    ) : (
                      "En cours"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{activity.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.durationMinutes} min
                        </div>
                      </div>
                      <Badge variant="outline">
                        {activity.score}/100
                      </Badge>
                    </div>
                  ))}
                  {studentData.recentActivity.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune activité récente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read ? "bg-muted" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                  {studentData.notifications.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune notification
                    </p>
                  )}
                </div>
                {studentData.notifications.some(n => !n.read) && (
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Marquer comme lu
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      {dashboard.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun enfant lié</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas encore d'enfants inscrits sur Notria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
