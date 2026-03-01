# TODO Notria (Etat Projet)

Date: 2026-03-01

## Fait

- Activation multi-matieres cote produit:
  - Mathématiques
  - Français
  - SVT
  - Physique-Chimie
- Chat IA connecte au backend avec:
  - creation/suivi conversations par matiere
  - fallback IA pedagogique
  - nettoyage des fuites de prompt interne
- RAG:
  - ingestion depuis `server/data/raw`
  - recherche vectorielle avec filtres (`grade`, `sourceType`, `chapter`, `subject`)
  - citations + fiabilite exposees dans la reponse
- UI chat:
  - affichage des references plus lisible (bloc dedie)
  - compatibilite ancien format `Sources: ...`
  - correction duplication/qualite quick replies
- Session guidee:
  - flow etat par etat (intro -> explain -> check -> practice -> recap)
  - ton IA ajuste pour eleves de 3e (plus clair, moins familier excessif)
  - meilleure coherence texte/interaction
- Dashboard eleve:
  - progression par competence
  - actions rapides (programme, question libre, defi, vision)
  - section gamification enrichie (ligue, rang, missions, proches)
- Gamification:
  - points, ligues, classement
  - missions quotidiennes
  - progression hebdo + jalon suivant
- Parent/admin:
  - liaison parent-eleve via code
  - pages parent/admin branchees au socle existant

## Reste a faire (priorite haute)

- RAG coverage:
  - completer les contenus BEPC par chapitre et par matiere
  - dashboard de couverture avec seuils d'alerte (chapitres vides)
- Qualite IA:
  - prompt registry versionne pour TOUS les flux IA
  - schemas Zod + retries structures sur tous les retours JSON
  - metriques IA (latence, fallback rate, satisfaction)
- Session guidee premium:
  - pilotage 100% backend des figures/steps du tableau
  - reprise exacte de session apres refresh
  - synchronisation fine narration <-> animation tableau
- Produit parent:
  - timeline hebdo lisible (temps, score, faiblesses, actions recommandees)
  - notifications persistantes + filtres
- Produit admin:
  - filtres avances (classe, matiere, niveau, periode)
  - export CSV robuste
  - monitoring qualite IA/RAG
- Fiabilite backend:
  - stabiliser `tsc` global (hors scope local)
  - durcir gestion erreurs DB/provider
  - logs centralises + correlation request id + Sentry complet

## Reste a faire (priorite moyenne)

- Gamification v2:
  - saisons/ligues hebdo
  - badges par competence
  - challenges entre amis/classe
- UX:
  - harmoniser UI sur toutes les pages (eleve/parent/admin)
  - audit mobile complet
- Donnees:
  - pipeline de qualification de donnees avant ingestion
  - scripts de verification qualité corpus

## Checklist release (avant push production)

- [ ] `pnpm -C server exec tsc --noEmit`
- [ ] `pnpm -C client exec tsc --noEmit`
- [ ] `pnpm db:push`
- [ ] `pnpm --filter @notria/server ingest:rag`
- [ ] verifier `GET /health`
- [ ] verifier login + onboarding + chat + session today + dashboard parent/admin
