# Notria - Checklist Execution

## 1) Chat et seances guidees
- [x] Stabiliser le chat naturel (sans labels internes visibles)
- [x] Afficher le tableau anime de maniere fiable pour les cours de maths
- [x] Limiter et contextualiser les reponses rapides (pas de suggestions sur chat vide)
- [ ] Harmoniser chat libre et seance guidee (`/session/today`)
- [ ] Ajouter tests d'integration minimum (creation conversation + streaming + rendu)

## 2) Dashboard eleve (complet mais simple)
- [x] Consolider toutes les donnees utiles sur une page claire
- [x] Connecter sessions du jour, devoirs du jour, progression semaine
- [ ] Simplifier les CTA: commencer session, question libre, BEPC blanc
- [ ] Supprimer les etats incoherents/fallbacks statiques

## 3) Espace parent (100% dynamique)
- [x] Enlever les donnees mock restantes
- [x] Connecter un seul dashboard parent clair (enfant(s), activite, alertes, devoirs)
- [x] Corriger l'enregistrement parent (creation profil parent en base)
- [ ] Ajouter action "marquer notifications lues" connectee

## 4) Admin
- [x] Creer la page `/admin` (vue supervision globale)
- [x] Ajouter endpoints admin: metriques, utilisateurs, conversations, activite
- [x] Ajouter actions de gestion minimales (activer/desactiver utilisateur)
- [x] Verrouiller acces par role (`admin`)

## 5) Cohesion globale
- [x] Redirections role-based propres (`student`, `parent`, `admin`)
- [ ] Unifier les structures API (`{ success, data }`)
- [ ] Nettoyer les pages statiques residuelles
- [ ] Verifier ports/env (`client:4000`, `server:3001`)

## 6) Qualite
- [ ] Typecheck client/server (hors erreurs historiques connues)
- [ ] Smoke test parcours: inscription -> dashboard -> chat -> parent/admin
- [ ] Journal des regressions corrigees
