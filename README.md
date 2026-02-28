# NOTRIA - Tutorat IA BEPC (MVP en cours)

Plateforme de tutorat IA pour les élèves ivoiriens.  
L’état actuel est orienté **Mathématiques** avec parcours guidé, chat dynamique, dashboard élève, espace parent et page admin.

## État actuel

### Front
- Chat élève dynamique (`/chat`)
  - streaming
  - réponses rapides contextuelles
  - nettoyage des instructions internes
  - rendu tableau seulement si `board_sequence` explicite
- Dashboard élève (`/dashboard`)
  - sessions semaine + devoirs du jour + actions rapides
  - logique `Commencer` / `Continuer` selon conversation existante
- Examens dynamiques (`/examens`)
  - connecté à `GET /api/assessment/overview`
- Espace parent dynamique (`/parent/dashboard`)
  - données réelles backend (plus de mocks)
- Page admin (`/admin`)
  - overview, utilisateurs, activité, activation/désactivation utilisateur

### Back
- Auth JWT + refresh token
- Chat SSE + génération IA (OpenAI)
- Assessment adaptatif + résultats
- Endpoints parent protégés par rôle `parent`
- Endpoints admin protégés par rôle `admin`
- Endpoint overview examens: `GET /api/assessment/overview`

## Stack
- Monorepo `pnpm`
- Front: Next.js 15
- Back: Express + TypeScript
- DB: PostgreSQL + Drizzle

## Démarrage rapide

### Prérequis
- Node.js 22+
- pnpm 10+
- PostgreSQL

### Installation
```bash
pnpm install
```

### Variables d’environnement
Configurer `server/.env` (ou `.env.local`) avec au minimum:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Exemple DB locale:
```env
DATABASE_URL=postgresql://root:password@localhost:5433/notria
```

### Base de données
```bash
pnpm db:push
```

### Lancer l’app
```bash
# back (3001)
pnpm dev:server

# front (4000)
pnpm dev:client

# ou les deux
pnpm dev
```

### URLs
- Frontend: http://localhost:4000
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

## Scripts utiles
```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
pnpm db:push
pnpm db:studio
```

## Note
- Le repo contient encore quelques erreurs TypeScript historiques côté serveur hors périmètre MVP (modules annexes), mais les parcours principaux front/back ci-dessus sont fonctionnels.
