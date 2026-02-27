"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, BookOpen, Mic, MicOff, Send, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface TodaysSession {
  hasSession: boolean;
  session?: {
    id: number;
    subject: string;
    startTime: string;
    durationMinutes: number;
    conversationId: number;
  };
}

interface NarrationStep {
  id: string;
  text: string;
  delay: number; // milliseconds
  showExercise?: boolean;
  exercise?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

const SAMPLE_NARRATION: NarrationStep[] = [
  {
    id: "intro",
    text: "Salut ! Prête pour ta première séance ? Aujourd'hui on attaque les dérivées. Je sais que ça peut faire peur, mais tu vas voir, c'est pas si compliqué une fois qu'on a compris le concept.",
    delay: 2000,
  },
  {
    id: "concept",
    text: "D'abord, dis-moi : tu as déjà entendu parler des dérivées en cours au lycée ?",
    delay: 1500,
  },
  {
    id: "analogy",
    text: "Imagine que tu es en moto, tu roules. À un moment tu regardes ton compteur de vitesse : il affiche 60 km/h. Cette vitesse, c'est comme une DÉRIVÉE. Ta position sur la route change dans le temps → ta vitesse mesure À QUELLE VITESSE ta position change.",
    delay: 3000,
  },
  {
    id: "math",
    text: "Pareil avec une fonction mathématique : La fonction change → sa dérivée mesure à quelle vitesse elle change.",
    delay: 2000,
  },
  {
    id: "exercise1",
    text: "On va voir comment calculer une dérivée concrètement. Regarde cet exemple : f(x) = x²",
    delay: 1500,
    showExercise: true,
    exercise: {
      question: "Quelle est la dérivée de f(x) = x² ?",
      options: ["f'(x) = x", "f'(x) = 2x", "f'(x) = x²", "f'(x) = 2"],
      correctAnswer: 1,
    },
  },
  {
    id: "explanation",
    text: "La règle c'est : la dérivée de xⁿ = n*x^(n-1). Pour x², n=2, donc 2*x^(2-1) = 2x. Ça te parle un peu mieux comme ça ?",
    delay: 2500,
  },
  {
    id: "continue",
    text: "Super ! Maintenant on va faire quelques exercices ensemble pour consolider ça.",
    delay: 1500,
  },
];

export default function SessionToday() {
  const router = useRouter();
  const [session, setSession] = useState<TodaysSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isNarrating, setIsNarrating] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [exerciseAnswer, setExerciseAnswer] = useState<number | null>(null);
  const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    loadTodaysSession();
  }, []);

  const loadTodaysSession = async () => {
    try {
      const response = await api.get("/sessions/today");
      setSession(response.data);
    } catch (error) {
      console.error("Failed to load today's session:", error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!session?.session) return;

    try {
      await api.post("/sessions/start", { sessionId: session.session.id });
      setStarted(true);
      startNarration();
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const startNarration = () => {
    setIsNarrating(true);
    setCurrentStep(0);
    typeText(SAMPLE_NARRATION[0]);
  };

  const typeText = (step: NarrationStep) => {
    setDisplayedText("");
    const text = step.text;
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          if (step.showExercise) {
            setShowExercise(true);
          } else {
            nextStep();
          }
        }, step.delay);
      }
    }, 50); // Typing speed
  };

  const nextStep = () => {
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < SAMPLE_NARRATION.length) {
      setCurrentStep(nextStepIndex);
      typeText(SAMPLE_NARRATION[nextStepIndex]);
    } else {
      // Session completed
      setIsNarrating(false);
      setSessionCompleted(true);
    }
  };

  const submitExercise = () => {
    if (exerciseAnswer === null) return;

    const step = SAMPLE_NARRATION[currentStep];
    const isCorrect = exerciseAnswer === step.exercise?.correctAnswer;
    setExerciseCorrect(isCorrect);

    setTimeout(() => {
      setShowExercise(false);
      setExerciseAnswer(null);
      setExerciseCorrect(null);
      nextStep();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification des séances du jour...</p>
        </div>
      </div>
    );
  }

  if (!session?.hasSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pas de séance prévue aujourd'hui</h2>
            <p className="text-muted-foreground mb-6">
              Profites-en pour réviser ou te reposer. Ta prochaine séance est programmée selon ton planning.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      {!started && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              SÉANCE DU JOUR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{session.session?.subject}</h3>
                <p className="text-muted-foreground">
                  Introduction aux Dérivées
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.session?.durationMinutes} min
              </Badge>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Ce que tu vas apprendre :</h4>
              <ul className="text-blue-800 space-y-1">
                <li>✅ C'est quoi une dérivée</li>
                <li>✅ Formules de base</li>
                <li>✅ Premiers exercices</li>
              </ul>
            </div>

            <Button onClick={startSession} size="lg" className="w-full">
              <Play className="mr-2 h-4 w-4" />
              DÉMARRER LA SÉANCE
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Narration Interface */}
      {started && !sessionCompleted && (
        <Card className="min-h-[500px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Prof Ada
              </CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Mode vocal
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="space-y-4 min-h-[300px]">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  A
                </div>
                <div className="flex-1 bg-muted rounded-lg p-4">
                  <p className="text-sm">{displayedText}</p>
                  {isNarrating && (
                    <div className="flex gap-1 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exercise */}
            {showExercise && (
              <Card className="border-2 border-primary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-3">Exercice :</h4>
                  <p className="mb-4">{SAMPLE_NARRATION[currentStep].exercise?.question}</p>

                  <div className="space-y-2">
                    {SAMPLE_NARRATION[currentStep].exercise?.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setExerciseAnswer(index)}
                        className={`w-full p-3 text-left rounded border-2 transition-colors ${
                          exerciseAnswer === index
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </button>
                    ))}
                  </div>

                  {exerciseCorrect !== null && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                      exerciseCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}>
                      {exerciseCorrect ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                      )}
                      {exerciseCorrect ? "Bonne réponse !" : "Réponse incorrecte"}
                    </div>
                  )}

                  <Button
                    onClick={submitExercise}
                    disabled={exerciseAnswer === null}
                    className="w-full mt-4"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Valider
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Completed */}
      {sessionCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              SÉANCE TERMINÉE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">{session.session?.subject} - Dérivées (Partie 1)</div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">⏱️ Durée</div>
                  <div className="text-muted-foreground">{session.session?.durationMinutes} minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">📊 Score</div>
                  <div className="text-muted-foreground">8/10 (Très bien !)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">💡 Concepts</div>
                  <div className="text-muted-foreground">5/6 maîtrisés</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🎯 DEVOIRS :</h4>
                <p className="text-blue-800">5 exercices sur les dérivées</p>
                <p className="text-sm text-blue-700">Temps estimé : 15 min - À faire avant demain 20h</p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => router.push("/homework/today")} className="flex-1">
                  📝 Faire maintenant
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  ⏰ Me rappeler ce soir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
