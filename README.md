# Notria

Notria est une plateforme d'accompagnement scolaire pour eleves de 3eme (BEPC), avec un apprentissage guide et interactif.

Le produit combine:
- parcours pedagogique guide
- chat pedagogique contextuel
- suivi parent
- pilotage admin

Mise a jour (Mars 2026):
- Matieres actives: Mathématiques, Français, SVT, Physique-Chimie
- Chat IA relie au RAG avec citations sources et score de fiabilite lisible
- Session guidee renforcee (format court, interaction eleve, visuels tableau)
- Gamification eleve amelioree (ligues, missions, progression hebdo)

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Fonctionnalites](#fonctionnalites)
- [Prerequis](#prerequis)
- [Configuration](#configuration)
- [Installation et demarrage](#installation-et-demarrage)
- [Base de donnees et migrations](#base-de-donnees-et-migrations)
- [RAG (ingestion + recherche)](#rag-ingestion--recherche)
- [Scripts utiles](#scripts-utiles)
- [Troubleshooting](#troubleshooting)

## Architecture

Monorepo pnpm:

```text
Notria/
  client/                # Frontend Next.js
  server/                # API Express + logique metier
  packages/shared/       # types, constantes, schemas Zod partages
```

## Stack technique

- Frontend: Next.js 15, React 18, Tailwind, shadcn/ui
- Backend: Express 4, TypeScript, Drizzle ORM
- DB relationnelle: PostgreSQL
- Recherche vectorielle: pgvector
- IA: OpenAI (chat + embeddings)
- Observabilite: logs HTTP avec request id, Sentry optionnel

## Fonctionnalites

### Authentification et roles

- Roles: `student`, `parent`, `admin`
- JWT access token + refresh token (cookie httpOnly)
- Endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

### Liaison parent <-> eleve

Liaison possible a l'inscription ou a la connexion avec `linkCode` (optionnel):
- parent saisit le code eleve
- eleve saisit le code parent

Chaque profil parent/eleve dispose d'un code de liaison unique.

### Parcours eleve

- onboarding
- evaluation de niveau
- programme de cours
- session du jour
- devoirs
- chat pedagogique
- seance guidee
- gamification (classement, missions, avatar, progression)

### Parcours parent

- dashboard de suivi
- notifications

### Parcours admin

- overview produit
- gestion utilisateurs
- export CSV
- suivi activite et metriques IA

## Prerequis

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (avec extension `vector`)
- cle OpenAI valide

## Configuration

Le backend charge `.env.local` puis `.env` (dossier `server`, puis racine).

### Variables serveur (`server/.env.local`)

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
OPENAI_API_KEY=<your_openai_api_key>
OPENAI_MODEL=gpt-4o-mini

JWT_SECRET=<strong_random_secret>
JWT_REFRESH_SECRET=<strong_random_secret>

SERVER_PORT=3001
CLIENT_URL=http://localhost:4000
NODE_ENV=development

# Optionnel
SENTRY_DSN=
```

### Variables client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation et demarrage

Depuis la racine du repo:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Applications:
- Frontend: `http://localhost:4000`
- API: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`

## Base de donnees et migrations

Commandes disponibles:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

Notes:
- `content_chunks.embedding` utilise le type `vector(1536)`
- l'extension `vector` doit etre installee sur l'instance PostgreSQL cible

## RAG (ingestion + recherche)

Dataset source:
- `server/data/raw/` (JSON structures)

Ingestion:

```bash
pnpm --filter @notria/server ingest:rag
```

API recherche:
- `POST /api/rag/search`
- `GET /api/rag/coverage`

Filtres supportes:
- `grade`
- `sourceType`
- `chapter`
- `subject`

Exemple:

```bash
curl -X POST http://localhost:3001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Pythagore triangle rectangle","limit":3}'
```

## Scripts utiles

```bash
pnpm dev
pnpm dev:client
pnpm dev:server

pnpm build
pnpm lint

pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio

pnpm --filter @notria/server ingest:rag
```

## Troubleshooting

### `ERR_CONNECTION_REFUSED` cote frontend

Verifier:
- `NEXT_PUBLIC_API_URL` pointe vers le bon port API
- serveur backend demarre

### `Database unavailable` / `ECONNREFUSED`

Verifier:
- `DATABASE_URL`
- etat de l'instance PostgreSQL
- acces reseau / port

### `type "vector" does not exist` ou `extension "vector" is not available`

L'extension pgvector n'est pas installee sur le serveur PostgreSQL cible.

### `/api/rag/search` renvoie `results: []`

Verifier:
1. table `content_chunks` non vide
2. ingestion executee
3. `OPENAI_API_KEY` valide
4. filtre `subject` coherent avec les donnees ingerees

### Erreur 401 provider IA

Verifier la validite de la cle API et redemarrer le serveur apres mise a jour des variables.

---

Pour la production, utiliser un fichier de configuration dedie a l'environnement (secrets manager recommande) et ne jamais committer de secrets.
