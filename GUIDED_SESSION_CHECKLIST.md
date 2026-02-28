# Checklist workflow "Seance guidee"

## 1) Cadrage pedagogique
- [x] Definir les etats du flow (`INTRO`, `EXPLAIN`, `CHECK`, `PRACTICE`, `VALIDATE`, `RECAP`)
- [x] Imposer des micro-reponses prof (2-3 phrases max)
- [x] Exiger une action eleve a chaque etape
- [x] Integrer boucle de remediation (si faux -> indice -> reessai)

## 2) Contrat technique
- [x] Creer des types partages pour les etapes et interactions (`@notria/shared`)
- [x] Standardiser les interactions (`choice`, `short_text`, `number`, `voice_or_text`)
- [x] Standardiser les visuels (`formula`, `diagram`, `exercise_card`)

## 3) Backend workflow engine
- [x] Ajouter un moteur de machine a etats (`GuidedSessionService`)
- [x] Ajouter endpoint start (`POST /api/guided-sessions/start`)
- [x] Ajouter endpoint respond (`POST /api/guided-sessions/:sessionId/respond`)
- [x] Ajouter endpoint current (`GET /api/guided-sessions/:sessionId`)
- [x] Brancher la route dans `server/src/index.ts`

## 4) Frontend renderer d'etapes
- [x] Remplacer `session/today` par une UI guidee et non chat libre
- [x] Afficher le contenu prof court + prompt
- [x] Afficher visuels selon le type d'etape
- [x] Afficher interaction dynamique selon le type (choix / texte / nombre)
- [x] Afficher feedback et progression
- [x] Ajouter recap de fin et relance de seance

## 5) Next steps produit
- [ ] Ajouter STT/TTS reel pour l'option vocale
- [ ] Persister les sessions en base (au lieu de memoire serveur)
- [x] Ajouter generation LLM des micro-etapes sous contrainte de format (OpenAI + fallback)
- [ ] Ajouter analytics (temps par etape, erreurs recurrentes, loops)
- [ ] Connecter exercices BEPC reels depuis la base de contenus
