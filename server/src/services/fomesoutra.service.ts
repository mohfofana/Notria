interface FomesoutraContent {
  title: string;
  subject: string;
  level: string;
  content: string;
  tags: string[];
  url: string;
  extractedAt: Date;
}

interface SubjectCurriculum {
  subject: string;
  chapters: Array<{
    title: string;
    topics: string[];
    objectives: string[];
  }>;
}

async function safeFetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (NotriaBot)",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export const FomesoutraService = {
  async scrapeCurriculum(): Promise<SubjectCurriculum[]> {
    const subjects = [
      "mathematiques",
      "physique-chimie",
      "svt",
      "francais",
      "philosophie",
      "anglais",
      "histoire-geographie",
    ];

    const curriculum: SubjectCurriculum[] = [];
    for (const subjectSlug of subjects) {
      const subjectCurriculum = await this.scrapeSubjectCurriculum("https://www.fomesoutra.com", subjectSlug);
      if (subjectCurriculum) curriculum.push(subjectCurriculum);
    }

    if (curriculum.length === 0) return this.getFallbackCurriculum();
    return curriculum;
  },

  async scrapeSubjectCurriculum(baseUrl: string, subjectSlug: string): Promise<SubjectCurriculum | null> {
    const html = await safeFetchText(`${baseUrl}/${subjectSlug}`);
    if (!html) {
      return {
        subject: this.slugToSubject(subjectSlug),
        chapters: this.getFallbackChapters(subjectSlug),
      };
    }

    const plain = stripHtml(html);
    const chapters = this.getFallbackChapters(subjectSlug);

    // Keep fallback chapter structure but adjust first objective with scraped snippet when available.
    if (plain.length > 80 && chapters.length > 0) {
      chapters[0] = {
        ...chapters[0],
        objectives: [plain.slice(0, 140), ...chapters[0].objectives].slice(0, 3),
      };
    }

    return {
      subject: this.slugToSubject(subjectSlug),
      chapters,
    };
  },

  async searchEducationalContent(query: string, subject?: string): Promise<FomesoutraContent[]> {
    const searchUrl = `https://www.fomesoutra.com/search?q=${encodeURIComponent(query)}`;
    const html = await safeFetchText(searchUrl);
    if (!html) return [];

    const plain = stripHtml(html);
    if (!plain) return [];

    return [
      {
        title: `Resultat fomesoutra: ${query}`,
        subject: subject || "General",
        level: "BEPC",
        content: plain.slice(0, 240),
        tags: this.extractTagsFromContent(plain),
        url: searchUrl,
        extractedAt: new Date(),
      },
    ];
  },

  async getCurriculumContext(subject: string, examType: "BEPC" | "BAC"): Promise<string> {
    try {
      const curriculum = await this.scrapeCurriculum();
      const subjectData = curriculum.find((c) => c.subject.toLowerCase() === subject.toLowerCase());

      if (!subjectData) {
        return this.getFallbackCurriculumContext(subject, examType);
      }

      return `
PROGRAMME ${examType.toUpperCase()} - ${subject.toUpperCase()}

CHAPITRES ET THEMES :
${subjectData.chapters
  .map(
    (chapter) => `
- ${chapter.title}
  Concepts: ${chapter.topics.join(", ")}
  Objectifs: ${chapter.objectives.join(", ")}`,
  )
  .join("\n")}
`;
    } catch {
      return this.getFallbackCurriculumContext(subject, examType);
    }
  },

  slugToSubject(slug: string): string {
    const mapping: Record<string, string> = {
      mathematiques: "Mathématiques",
      "physique-chimie": "Physique-Chimie",
      svt: "SVT",
      francais: "Français",
      philosophie: "Philosophie",
      anglais: "Anglais",
      "histoire-geographie": "Histoire-Géographie",
    };
    return mapping[slug] || slug;
  },

  extractSubjectFromUrl(url: string): string {
    const match = url.match(/\/([^\/]+)\/[^\/]*$/);
    return match ? this.slugToSubject(match[1]) : "Général";
  },

  extractLevelFromUrl(url: string): string {
    if (url.includes("bepc")) return "BEPC";
    if (url.includes("bac")) return "BAC";
    if (url.includes("terminale")) return "Terminale";
    if (url.includes("3eme")) return "3ème";
    return "Général";
  },

  extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    const keywords = [
      "algèbre", "géométrie", "analyse", "probabilité", "chimie", "physique",
      "biologie", "géologie", "grammaire", "littérature", "philosophie",
      "histoire", "géographie", "anglais", "vocabulaire", "exercice",
    ];

    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    }

    return tags;
  },

  getFallbackCurriculum(): SubjectCurriculum[] {
    return [
      {
        subject: "Mathématiques",
        chapters: [
          {
            title: "Algèbre",
            topics: ["Équations", "Inéquations", "Fonctions"],
            objectives: ["Résoudre des équations", "Maîtriser les fonctions"],
          },
          {
            title: "Géométrie",
            topics: ["Triangles", "Cercles", "Vecteurs"],
            objectives: ["Calculer des aires", "Utiliser la trigonométrie"],
          },
        ],
      },
      {
        subject: "SVT",
        chapters: [
          {
            title: "La cellule",
            topics: ["Structure cellulaire", "Division cellulaire"],
            objectives: ["Comprendre le fonctionnement cellulaire"],
          },
        ],
      },
    ];
  },

  getFallbackChapters(subjectSlug: string): Array<{ title: string; topics: string[]; objectives: string[] }> {
    switch (subjectSlug) {
      case "mathematiques":
        return [
          {
            title: "Calcul numerique",
            topics: ["Priorites operatoires", "Fractions", "Puissances"],
            objectives: ["Appliquer les priorites", "Resoudre des exercices types BEPC"],
          },
          {
            title: "Geometrie",
            topics: ["Pythagore", "Thales", "Aires"],
            objectives: ["Choisir le bon theoreme", "Justifier les etapes"],
          },
        ];
      case "physique-chimie":
        return [
          {
            title: "Electricite",
            topics: ["Circuit", "Tension", "Intensite"],
            objectives: ["Interpreter un schema de circuit"],
          },
        ];
      default:
        return [
          {
            title: "Chapitre principal",
            topics: ["Concept 1", "Concept 2"],
            objectives: ["Maitriser les bases"],
          },
        ];
    }
  },

  getFallbackCurriculumContext(subject: string, examType: "BEPC" | "BAC"): string {
    return `Programme ${examType} ${subject}: revoir definitions, methode, exercices types et verification des resultats.`;
  },
};
