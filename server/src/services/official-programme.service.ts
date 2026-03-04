type OfficialDocKind = "programme" | "progression" | "manuels";

interface OfficialDoc {
  kind: OfficialDocKind;
  label: string;
  url: string;
}

interface OfficialProgrammeProfile {
  examType: "BEPC";
  grade: "3eme";
  subject: string;
  competencies: string[];
  progressionOrder: string[];
  docs: OfficialDoc[];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const COMMON_DOCS: OfficialDoc[] = [
  {
    kind: "programme",
    label: "DPFC - Programmes educatifs et guides d'execution du Secondaire",
    url: "https://dpfc-ci.net/?page_id=283",
  },
  {
    kind: "progression",
    label: "DPFC - Progressions du Secondaire 2025-2026",
    url: "https://dpfc-ci.net/?page_id=5267",
  },
  {
    kind: "manuels",
    label: "DPFC - Manuels scolaires et supports agrees/recommandes",
    url: "https://dpfc-ci.net/?page_id=71",
  },
];

const OFFICIAL_PROGRAMMES: OfficialProgrammeProfile[] = [
  {
    examType: "BEPC",
    grade: "3eme",
    subject: "Mathématiques",
    competencies: [
      "Calcul numerique et calcul litteral",
      "Equations, inequations et systemes",
      "Geometrie plane et dans l'espace",
      "Statistiques et probabilites",
    ],
    progressionOrder: [
      "Calcul numerique",
      "Calcul litteral",
      "Equations et inequations",
      "Fonctions lineaires et affines",
      "Geometrie plane",
      "Trigonometrie",
      "Statistiques",
    ],
    docs: [
      ...COMMON_DOCS,
      {
        kind: "programme",
        label: "DPFC - Programme educatif Maths 3e",
        url: "https://dpfc-ci.net/dpfc/programmes/maths/04.%20Prog%20%C3%89duct%20MATHS%203e%20CND%200923.pdf",
      },
      {
        kind: "progression",
        label: "DPFC - Progressions Maths 2025-2026",
        url: "https://dpfc-ci.net/dpfc/2026/progressions/MATHS%20-%20Progressions%20%202025-2026.pdf",
      },
    ],
  },
  {
    examType: "BEPC",
    grade: "3eme",
    subject: "Français",
    competencies: [
      "Lecture et comprehension",
      "Expression ecrite et orale",
      "Grammaire, conjugaison et orthographe",
      "Resume et production de texte",
    ],
    progressionOrder: [
      "Grammaire",
      "Conjugaison",
      "Orthographe",
      "Expression ecrite",
      "Comprehension de texte",
      "Resume de texte",
    ],
    docs: [
      ...COMMON_DOCS,
      {
        kind: "programme",
        label: "DPFC - Programme educatif Francais 3e",
        url: "https://dpfc-ci.net/wp-content/uploads/dpfc_fichiers/Programmes/prg_secondaire/Fran/PROGRAMME%20EDUCATIF%203e%20VALIDE.pdf",
      },
      {
        kind: "progression",
        label: "DPFC - Progressions Francais 1er cycle 2025-2026",
        url: "https://dpfc-ci.net/dpfc/2026/progressions/FRANCAIS_PROGRESSIONS_A%20USAGE%20PEDAGOGIQUE%20_2025-2026%201er%20Cycle%20DPFC.pdf",
      },
    ],
  },
  {
    examType: "BEPC",
    grade: "3eme",
    subject: "Anglais",
    competencies: [
      "Reading comprehension",
      "Grammar and vocabulary",
      "Written production",
      "Functional communication",
    ],
    progressionOrder: [
      "Grammar basics",
      "Reading comprehension",
      "Vocabulary",
      "Verb tenses",
      "Writing paragraphs",
      "Everyday English",
    ],
    docs: [
      ...COMMON_DOCS,
      {
        kind: "programme",
        label: "DPFC - Programme educatif Anglais 3e",
        url: "https://dpfc-ci.net/wp-content/uploads//dpfc_fichiers/Programmes/prg_secondaire/Anglais/ANGLAIS_3eme.pdf",
      },
      {
        kind: "progression",
        label: "DPFC - Progressions Anglais 3e 2025-2026",
        url: "https://dpfc-ci.net/dpfc/2026/progressions/Anglais%20Progression%203%C3%A8me%202025-2026.pdf",
      },
    ],
  },
  {
    examType: "BEPC",
    grade: "3eme",
    subject: "SVT",
    competencies: [
      "Organisation et fonctionnement du vivant",
      "Corps humain, nutrition et reproduction",
      "Environnement et sante",
      "Demarche scientifique",
    ],
    progressionOrder: [
      "La cellule",
      "Le corps humain",
      "La nutrition",
      "La reproduction",
      "L'environnement",
    ],
    docs: [
      ...COMMON_DOCS,
      {
        kind: "programme",
        label: "DPFC - Programme educatif SVT 3e",
        url: "https://dpfc-ci.net/wp-content/uploads//dpfc_fichiers/Programmes/prg_secondaire/SVT/SVT_3eme.pdf",
      },
      {
        kind: "progression",
        label: "DPFC - Progressions SVT 2025-2026",
        url: "https://dpfc-ci.net/dpfc/2026/progressions/SVT%20PROGRESSIONS%20ANNUELLES%202025%202026%20.pdf",
      },
    ],
  },
  {
    examType: "BEPC",
    grade: "3eme",
    subject: "Physique-Chimie",
    competencies: [
      "Electricite et energie",
      "Optique et mecanique simples",
      "Matiere, solutions et transformations chimiques",
      "Resolution de problemes experimentaux",
    ],
    progressionOrder: [
      "Electricite de base",
      "Mecanique simple",
      "Optique geometrique",
      "Chimie des solutions",
      "Matiere et transformations",
    ],
    docs: [
      ...COMMON_DOCS,
      {
        kind: "programme",
        label: "DPFC - Programme educatif Physique-Chimie 3e",
        url: "https://dpfc-ci.net/wp-content/uploads//dpfc_fichiers/Programmes/prg_secondaire/Physique_Chimie/PHYSIQUE-CHIMIE_3eme.pdf",
      },
      {
        kind: "progression",
        label: "DPFC - Progressions Physique-Chimie 2025-2026",
        url: "https://dpfc-ci.net/dpfc/2026/progressions/Physique-Chimie%20Progressions%202025-2026.pdf",
      },
    ],
  },
];

export const OfficialProgrammeService = {
  getProfile(subject: string, examType: "BEPC" | "BAC"): OfficialProgrammeProfile | null {
    if (examType !== "BEPC") return null;
    const target = normalize(subject);
    return OFFICIAL_PROGRAMMES.find((entry) => normalize(entry.subject) === target) ?? null;
  },

  getContext(subject: string, examType: "BEPC" | "BAC"): string {
    const profile = this.getProfile(subject, examType);
    if (!profile) return "";

    const docs = profile.docs.map((doc) => `- [${doc.kind}] ${doc.label}: ${doc.url}`).join("\n");
    const competencies = profile.competencies.map((item) => `- ${item}`).join("\n");
    const progression = profile.progressionOrder.map((item, index) => `${index + 1}. ${item}`).join("\n");

    return [
      `REFERENTIEL OFFICIEL COTE D'IVOIRE (${profile.examType} ${profile.grade.toUpperCase()})`,
      `Matiere: ${profile.subject}`,
      "",
      "Competences cibles:",
      competencies,
      "",
      "Ordre de progression recommande (annee scolaire en cours):",
      progression,
      "",
      "Sources officielles DPFC/MENA:",
      docs,
    ].join("\n");
  },
};
