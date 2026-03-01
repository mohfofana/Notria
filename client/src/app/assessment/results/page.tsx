"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

interface DomainLevel { level: string; percentage: number; }
interface AssessmentResultsData { subjectLevels: Record<string, DomainLevel>; overallAverage: number; }

function getLevelLabel(level: string) {
  const n = level.toLowerCase();
  if (n.includes("debutant") || n.includes("dÃ©butant")) return "Debutant";
  if (n.includes("intermediaire") || n.includes("intermÃ©diaire")) return "Intermediaire";
  if (n.includes("avance") || n.includes("avancÃ©")) return "Avance";
  return level;
}

function barColor(pct: number) { return pct >= 80 ? "bg-accent" : pct >= 60 ? "bg-warning" : "bg-destructive"; }
function textColor(pct: number) { return pct >= 80 ? "text-accent" : pct >= 60 ? "text-warning-foreground" : "text-destructive"; }

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { student, refreshMe } = useAuth();
  const [results, setResults] = useState<AssessmentResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/assessment/results"); if (data.success) setResults(data.data); }
      catch {}
      finally { setLoading(false); }
    })();
  }, []);

  async function handleContinue() { await refreshMe(); router.push("/programme"); }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Calcul de tes resultats...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Impossible de charger les resultats</p>
        <Button onClick={() => router.push("/assessment/start")}>Refaire le test</Button>
      </div>
    );
  }

  const scoreOn20 = Math.round((results.overallAverage / 100) * 20 * 10) / 10;
  const targetScore = student?.targetScore ?? 14;
  const gap = Math.max(0, targetScore - scoreOn20);
  const domains = Object.entries(results.subjectLevels).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Tes resultats</h1>
        <p className="text-sm text-muted-foreground mt-1">Ton niveau par domaine de maths</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <div className="font-display text-5xl font-bold text-primary">{scoreOn20}<span className="text-lg text-muted-foreground">/20</span></div>
        <Progress value={results.overallAverage} className="h-2 mt-3" />
        <p className="text-xs text-muted-foreground mt-2">
          Score global: {results.overallAverage}%
          {gap > 0 && ` — Il te manque ${gap.toFixed(1)} pts pour ${targetScore}/20`}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="font-display text-sm font-semibold mb-1">Par domaine</p>
        {domains.map(([domain, data]) => (
          <div key={domain}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium truncate">{domain}</span>
              <span className={`text-[10px] font-semibold ${textColor(data.percentage)}`}>
                {getLevelLabel(data.level)} ({data.percentage}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(data.percentage)}`} style={{ width: `${data.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Ce que ca veut dire
        </p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {domains.filter(([, d]) => d.percentage < 60).map(([name]) => (
            <li key={name}><span className="text-destructive font-medium">{name}</span> : on reprend les bases</li>
          ))}
          {domains.filter(([, d]) => d.percentage >= 60 && d.percentage < 80).map(([name]) => (
            <li key={name}><span className="text-warning-foreground font-medium">{name}</span> : bonne base, on approfondit</li>
          ))}
          {domains.filter(([, d]) => d.percentage >= 80).map(([name]) => (
            <li key={name}><span className="text-accent font-medium">{name}</span> : tres bon niveau</li>
          ))}
        </ul>
      </div>

      <Button onClick={handleContinue} size="xl" className="w-full">
        <Play className="h-4 w-4" /> Voir mon programme
      </Button>
    </div>
  );
}
