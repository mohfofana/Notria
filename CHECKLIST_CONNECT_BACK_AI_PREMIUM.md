# Checklist Connection Back + IA + Tableau

## 1) Espace Eleve (back + front)
- [x] Remplacer les valeurs fixes de `SessionService.startSession` (sujet, duree, score).
- [x] Generer les devoirs dynamiquement (IA + fallback robuste).
- [x] Dashboard eleve: brancher la session du jour (`/sessions/today`) et afficher l'etat reel.
- [x] Ajouter un refresh fiable des donnees dashboard.

## 2) Espace Parent (back + front)
- [x] Dashboard parent 100% depuis API (`/parent/dashboard`).
- [x] Corriger `markNotificationAsRead` avec etat de lecture effectif.
- [x] Conserver l'etat "lu/non lu" dans le service parent (memoire serveur).

## 3) Espace Admin (back + front)
- [x] Enrichir activite recente avec infos eleve utiles.
- [x] Brancher filtres/recherche utilisateurs sur API (`/admin/users`).
- [x] Ajouter action de refresh et gestion d'erreur plus fiable.

## 4) IA plus intelligente / robuste / fiable
- [x] Chat: fallback si OpenAI indisponible ou erreur auth.
- [x] Chat: prompt renforce et sanitation de sortie pour UX stable.
- [x] Streaming: ne pas casser l'UI en cas d'erreur IA, retourner une reponse de secours.

## 5) Tableau seance guidee (premium)
- [x] Illustration contextuelle basee sur le contenu de l'etape.
- [x] Feedback prof integre au tableau.
- [x] Suppression des effets qui masquent le texte.

## 6) Validation
- [x] Verification TypeScript client.
- [x] Verification TypeScript ciblee sur services modifies serveur.
