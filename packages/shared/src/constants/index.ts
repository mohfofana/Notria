export const SUPPORTED_COUNTRIES = {
  CI: "Côte d'Ivoire",
} as const;

export const BAC_SERIES = ["A1", "A2", "C", "D"] as const;

export const BAC_SUBJECTS = {
  common: ["Français", "Philosophie", "Histoire-Géographie", "Anglais", "EPS"],
  A1: ["Espagnol", "Allemand", "Latin"],
  A2: ["Espagnol", "Allemand"],
  C: ["Mathématiques", "Physique-Chimie", "SVT"],
  D: ["Mathématiques", "Physique-Chimie", "SVT"],
} as const;

export const BEPC_SUBJECTS = [
  "Mathématiques",
  "Français",
  "Anglais",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géographie",
] as const;

export const MATH_TOPICS_BAC_CD = [
  "Suites numériques",
  "Fonctions numériques",
  "Limites et continuité",
  "Dérivation",
  "Étude de fonctions",
  "Logarithme et exponentielle",
  "Probabilités",
  "Statistiques",
  "Géométrie dans l'espace",
  "Nombres complexes",
] as const;

export const MATH_TOPICS_BEPC = [
  "Calcul numérique",
  "Calcul littéral",
  "Équations et inéquations",
  "Systèmes d'équations",
  "Fonctions linéaires et affines",
  "Statistiques",
  "Géométrie plane",
  "Trigonométrie",
  "Figures et transformations",
  "Problèmes de la vie courante",
] as const;

export const PHYSICS_TOPICS_BAC_CD = [
  "Mécanique du point",
  "Énergie mécanique",
  "Électricité",
  "Optique",
  "Chimie organique",
  "Réactions chimiques",
  "Solutions aqueuses",
  "Ondes mécaniques",
] as const;

export const SVT_TOPICS_BAC_CD = [
  "Génétique",
  "Hérédité humaine",
  "Immunologie",
  "Neurophysiologie",
  "Reproduction humaine",
  "Écologie",
  "Géologie",
  "Évolution",
] as const;

export const TOPICS_BY_SUBJECT: Record<string, readonly string[]> = {
  "Mathématiques_BAC": MATH_TOPICS_BAC_CD,
  "Mathématiques_BEPC": MATH_TOPICS_BEPC,
  "Physique-Chimie_BAC": PHYSICS_TOPICS_BAC_CD,
  "SVT_BAC": SVT_TOPICS_BAC_CD,
};

export const SUBSCRIPTION_LIMITS = {
  gratuit: { messagesPerDay: 5, exercisesPerDay: 2, hasStudyPlan: false, hasParentDashboard: false },
  standard: { messagesPerDay: 100, exercisesPerDay: 20, hasStudyPlan: true, hasParentDashboard: false },
  premium: { messagesPerDay: Infinity, exercisesPerDay: Infinity, hasStudyPlan: true, hasParentDashboard: true },
} as const;

export const SUBSCRIPTION_PRICES = {
  gratuit: 0,
  standard: 2000,
  premium: 3500,
} as const;

export function getSubjectsForStudent(examType: "BEPC" | "BAC", series?: string): string[] {
  if (examType === "BEPC") {
    return [...BEPC_SUBJECTS];
  }
  const seriesSubjects = BAC_SUBJECTS[series as keyof typeof BAC_SUBJECTS] ?? [];
  return [...BAC_SUBJECTS.common, ...seriesSubjects];
}

export function getTopicsForSubject(subject: string, examType: "BEPC" | "BAC"): readonly string[] {
  const key = `${subject}_${examType}`;
  return TOPICS_BY_SUBJECT[key] ?? [];
}
