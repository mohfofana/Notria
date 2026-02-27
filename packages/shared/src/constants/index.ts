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

/** Matières réellement disponibles (contenu + RAG prêts). Étendre au fur et à mesure. */
export const AVAILABLE_BEPC_SUBJECTS: readonly string[] = ["Mathématiques"];

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

export const FRENCH_TOPICS_BAC = [
  "Commentaire composé",
  "Dissertation littéraire",
  "Résumé et discussion",
  "Textes argumentatifs",
  "Textes narratifs",
  "Analyse stylistique",
  "Littérature africaine",
  "Littérature française",
] as const;

export const FRENCH_TOPICS_BEPC = [
  "Grammaire",
  "Conjugaison",
  "Orthographe",
  "Expression écrite",
  "Compréhension de texte",
  "Vocabulaire",
  "Résumé de texte",
  "Dictée et réécriture",
] as const;

export const PHILO_TOPICS_BAC = [
  "La conscience",
  "L'inconscient",
  "La liberté",
  "Le devoir",
  "La justice",
  "La vérité",
  "La raison",
  "L'art",
] as const;

export const HISTORY_GEO_TOPICS_BAC = [
  "Décolonisation en Afrique",
  "La Guerre Froide",
  "Le monde contemporain",
  "L'Afrique depuis 1960",
  "Géographie de la Côte d'Ivoire",
  "Géographie de l'Afrique",
  "Population et développement",
  "Mondialisation",
] as const;

export const HISTORY_GEO_TOPICS_BEPC = [
  "Histoire de la Côte d'Ivoire",
  "Colonisation et décolonisation",
  "Géographie de la Côte d'Ivoire",
  "Population et démographie",
  "Les ressources naturelles",
  "Les grandes civilisations africaines",
] as const;

export const ENGLISH_TOPICS_BAC = [
  "Reading comprehension",
  "Essay writing",
  "Grammar and tenses",
  "Vocabulary in context",
  "Letter and email writing",
  "Oral communication",
] as const;

export const ENGLISH_TOPICS_BEPC = [
  "Grammar basics",
  "Reading comprehension",
  "Vocabulary",
  "Verb tenses",
  "Writing paragraphs",
  "Everyday English",
] as const;

export const PHYSICS_TOPICS_BEPC = [
  "Mécanique simple",
  "Électricité de base",
  "Optique géométrique",
  "Chimie des solutions",
  "Matière et transformations",
  "Énergie",
] as const;

export const SVT_TOPICS_BEPC = [
  "Le corps humain",
  "La reproduction",
  "La nutrition",
  "L'environnement",
  "Les êtres vivants",
  "La cellule",
] as const;

export const TOPICS_BY_SUBJECT: Record<string, readonly string[]> = {
  "Mathématiques_BAC": MATH_TOPICS_BAC_CD,
  "Mathématiques_BEPC": MATH_TOPICS_BEPC,
  "Physique-Chimie_BAC": PHYSICS_TOPICS_BAC_CD,
  "Physique-Chimie_BEPC": PHYSICS_TOPICS_BEPC,
  "SVT_BAC": SVT_TOPICS_BAC_CD,
  "SVT_BEPC": SVT_TOPICS_BEPC,
  "Français_BAC": FRENCH_TOPICS_BAC,
  "Français_BEPC": FRENCH_TOPICS_BEPC,
  "Philosophie_BAC": PHILO_TOPICS_BAC,
  "Histoire-Géographie_BAC": HISTORY_GEO_TOPICS_BAC,
  "Histoire-Géographie_BEPC": HISTORY_GEO_TOPICS_BEPC,
  "Anglais_BAC": ENGLISH_TOPICS_BAC,
  "Anglais_BEPC": ENGLISH_TOPICS_BEPC,
};

export const SUBSCRIPTION_LIMITS = {
  gratuit: { messagesPerDay: Infinity, exercisesPerDay: Infinity, hasStudyPlan: true, hasParentDashboard: true },
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
    return [...AVAILABLE_BEPC_SUBJECTS];
  }
  const seriesSubjects = BAC_SUBJECTS[series as keyof typeof BAC_SUBJECTS] ?? [];
  return [...BAC_SUBJECTS.common, ...seriesSubjects];
}

export function getTopicsForSubject(subject: string, examType: "BEPC" | "BAC"): readonly string[] {
  const key = `${subject}_${examType}`;
  return TOPICS_BY_SUBJECT[key] ?? [];
}
