import axios from "axios";
import * as cheerio from "cheerio";

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

export const FomesoutraService = {
  // Scrape educational content from fomesoutra.com
  async scrapeCurriculum(): Promise<SubjectCurriculum[]> {
    try {
      const baseUrl = "https://www.fomesoutra.com";
      const curriculum: SubjectCurriculum[] = [];

      // Subjects for different exam types
      const subjects = [
        "mathematiques",
        "physique-chimie",
        "svt",
        "francais",
        "philosophie",
        "anglais",
        "histoire-geographie"
      ];

      for (const subjectSlug of subjects) {
        try {
          const subjectCurriculum = await this.scrapeSubjectCurriculum(baseUrl, subjectSlug);
          if (subjectCurriculum) {
            curriculum.push(subjectCurriculum);
          }
        } catch (error) {
          console.error(`Error scraping ${subjectSlug}:`, error);
        }
      }

      return curriculum;
    } catch (error) {
      console.error("Error scraping fomesoutra curriculum:", error);
      return this.getFallbackCurriculum();
    }
  },

  async scrapeSubjectCurriculum(baseUrl: string, subjectSlug: string): Promise<SubjectCurriculum | null> {
    try {
      const url = `${baseUrl}/${subjectSlug}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extract chapters and topics
      const chapters: Array<{ title: string; topics: string[]; objectives: string[] }> = [];

      // Look for curriculum sections (this will need adjustment based on actual site structure)
      $('.chapter, .section, .topic').each((index, element) => {
        const title = $(element).find('h2, h3, .title').first().text().trim();
        if (title) {
          const topics: string[] = [];
          const objectives: string[] = [];

          // Extract subtopics
          $(element).find('li, .subtopic').each((_, subElement) => {
            const topicText = $(subElement).text().trim();
            if (topicText) {
              if (topicText.toLowerCase().includes('objectif') ||
                  topicText.toLowerCase().includes('savoir')) {
                objectives.push(topicText);
              } else {
                topics.push(topicText);
              }
            }
          });

          chapters.push({ title, topics, objectives });
        }
      });

      return {
        subject: this.slugToSubject(subjectSlug),
        chapters: chapters.length > 0 ? chapters : this.getFallbackChapters(subjectSlug)
      };
    } catch (error) {
      console.error(`Error scraping ${subjectSlug}:`, error);
      return null;
    }
  },

  async searchEducationalContent(query: string, subject?: string): Promise<FomesoutraContent[]> {
    try {
      // Search for specific educational content
      const searchUrl = `https://www.fomesoutra.com/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results: FomesoutraContent[] = [];

      // Extract search results (adjust selectors based on actual site structure)
      $('.search-result, .content-item').each((index, element) => {
        const title = $(element).find('h3, .title').first().text().trim();
        const link = $(element).find('a').first().attr('href');
        const excerpt = $(element).find('.excerpt, .summary').first().text().trim();

        if (title && link) {
          results.push({
            title,
            subject: subject || this.extractSubjectFromUrl(link),
            level: this.extractLevelFromUrl(link),
            content: excerpt,
            tags: this.extractTagsFromContent(excerpt),
            url: link.startsWith('http') ? link : `https://www.fomesoutra.com${link}`,
            extractedAt: new Date()
          });
        }
      });

      return results;
    } catch (error) {
      console.error("Error searching fomesoutra content:", error);
      return [];
    }
  },

  // Get curriculum data for AI context
  async getCurriculumContext(subject: string, examType: "BEPC" | "BAC"): Promise<string> {
    try {
      const curriculum = await this.scrapeCurriculum();
      const subjectData = curriculum.find(c => c.subject.toLowerCase() === subject.toLowerCase());

      if (!subjectData) {
        return this.getFallbackCurriculumContext(subject, examType);
      }

      const context = `
PROGRAMME ${examType.toUpperCase()} - ${subject.toUpperCase()}

CHAPITRES ET THÈMES :
${subjectData.chapters.map(chapter => `
📚 ${chapter.title}
• Concepts: ${chapter.topics.join(', ')}
• Objectifs: ${chapter.objectives.join(', ')}
`).join('\n')}

Ce contenu est adapté au système éducatif ivoirien et au programme officiel ${examType}.
`;

      return context;
    } catch (error) {
      console.error("Error getting curriculum context:", error);
      return this.getFallbackCurriculumContext(subject, examType);
    }
  },

  // Helper methods
  slugToSubject(slug: string): string {
    const mapping: Record<string, string> = {
      "mathematiques": "Mathématiques",
      "physique-chimie": "Physique-Chimie",
      "svt": "SVT",
      "francais": "Français",
      "philosophie": "Philosophie",
      "anglais": "Anglais",
      "histoire-geographie": "Histoire-Géographie"
    };
    return mapping[slug] || slug;
  },

  extractSubjectFromUrl(url: string): string {
    const match = url.match(/\/([^\/]+)\/[^\/]*$/);
    return match ? this.slugToSubject(match[1]) : "Général";
  },

  extractLevelFromUrl(url: string): string {
    if (url.includes('bepc')) return 'BEPC';
    if (url.includes('bac')) return 'BAC';
    if (url.includes('terminale')) return 'Terminale';
    if (url.includes('3eme')) return '3ème';
    return 'Général';
  },

  extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    const keywords = [
      'algèbre', 'géométrie', 'analyse', 'probabilité', 'chimie', 'physique',
      'biologie', 'géologie', 'grammaire', 'littérature', 'philosophie',
      'histoire', 'géographie', 'anglais', 'vocabulaire', 'exercice'
    ];

    keywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });

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
            objectives: ["Résoudre des équations", "Maîtriser les fonctions"]
          },
          {
            title: "Géométrie",
            topics: ["Triangles", "Cercles", "Vecteurs"],
            objectives: ["Calculer des aires", "Utiliser la trigonométrie"]
          }
        ]
      },
      {
        subject: "SVT",
        chapters: [
          {
            title: "La cellule",
            topics: ["Structure cellulaire", "Division cellulaire"],
            objectives: ["Comprendre le fonctionnement cellulaire"]
          },
          {
            title: "Génétique",
            topics: ["Hérédité", "ADN", "Mutation"],
            objectives: ["Expliquer l'hérédité"]
          }
        ]
      }
    ];
  },

  getFallbackChapters(subjectSlug: string): Array<{ title: string; topics: string[]; objectives: string[] }> {
    // Return default chapters based on subject
    switch (subjectSlug) {
      case "mathematiques":
        return [
          { title: "Nombres et calculs", topics: ["Opérations", "Fractions"], objectives: ["Maîtriser les calculs"] },
          { title: "Géométrie", topics: ["Figures planes", "Solides"], objectives: ["Calculer périmètres et aires"] }
        ];
      case "svt":
        return [
          { title: "La matière vivante", topics: ["Cellule", "Tissus"], objectives: ["Comprendre l'organisation du vivant"] },
          { title: "Évolution", topics: ["Sélection naturelle", "Adaptation"], objectives: ["Expliquer l'évolution"] }
        ];
      default:
        return [
          { title: "Chapitre 1", topics: ["Concept de base"], objectives: ["Comprendre les fondamentaux"] }
        ];
    }
  },

  getFallbackCurriculumContext(subject: string, examType: "BEPC" | "BAC"): string {
    return `
PROGRAMME ${examType.toUpperCase()} - ${subject.toUpperCase()}

CONTEXTE PÉDAGOGIQUE IVOIRIEN :
Ce contenu est adapté au système éducatif ivoirien et au programme officiel ${examType}.
Les questions doivent être conformes aux exigences du Ministère de l'Éducation Nationale de Côte d'Ivoire.

POINTS CLÉS À RESPECTER :
- Utiliser des exemples concrets liés au contexte africain/ivoirien
- Respecter les programmes officiels BEPC/BAC
- Adapter la difficulté selon le niveau de l'élève
- Inclure des références culturelles appropriées

Pour ${subject}, focus sur les concepts fondamentaux du programme ivoirien.`;
  }
};
