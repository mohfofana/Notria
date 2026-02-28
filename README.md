# Notria

Notria est un prof particulier IA pour les eleves en Cote d'Ivoire qui preparent le BEPC/BAC, avec un focus current sur les mathematiques 3eme (BEPC).  
L'assistant IA s'appelle **Prof Ada**.

## Objectif produit

Prof Ada ne doit pas etre un chatbot generique.  
Le produit vise un parcours pedagogique structure:

1. Inscription
2. Test de niveau adaptatif
3. Plan personnalise
4. Boucle quotidienne (cours -> exercices -> validation)
5. Fonctions hors session (photo math, question express)
6. BEPC blanc periodique
7. Dashboard parent

## Vision technique

Le coeur de la specialisation est le **RAG**:

- on ne re-entraine pas un modele from scratch
- on indexe le contenu BEPC CI (cours, annales, livres, exercices)
- a chaque question, on recupere les meilleurs chunks
- on envoie ce contexte au LLM pour une reponse adaptee

## Monorepo

```text
Notria/
  client/                 # Next.js app
  server/                 # Express + TypeScript API
  packages/
    shared/               # types + validation + constants partages
```

## Stack

- Frontend: Next.js 15, Tailwind, shadcn/ui
- Backend: Express.js + TypeScript
- DB: PostgreSQL + Drizzle ORM
- Vector search: pgvector
- Embeddings: OpenAI `text-embedding-3-small`
- Monorepo: pnpm workspaces

## Structure backend (active)

```text
server/src/
  controllers/
  services/
  routes/
  db/
    schema.ts
    index.ts
  middleware/
  lib/
  scripts/
    ingest.ts            # JSON -> chunks -> embeddings -> DB
```

## RAG implemente

### Schema DB

Table `content_chunks` ajoutee dans `server/src/db/schema.ts`:

- `source_type` (`cours|exercice|annale|livre`)
- `subject`, `grade`, `chapter`, `title`
- `content`
- `chunk_index`, `total_chunks`
- `embedding` (`vector(1536)`)
- `metadata` (`jsonb`)
- index HNSW cosine + index de filtres

### Endpoint

`POST /api/rag/search`

Body:

```json
{
  "query": "theoreme de pythagore",
  "limit": 5,
  "filters": {
    "chapter": "pythagore",
    "grade": "3eme",
    "sourceType": "cours"
  }
}
```

Retour:

```json
{
  "results": [
    {
      "id": 1,
      "content": "...",
      "chapter": "pythagore",
      "sourceType": "cours",
      "title": "...",
      "similarity": 0.70,
      "metadata": {}
    }
  ]
}
```

Regle actuelle: seuil de similarite `> 0.7`.

### Script ingestion

`server/src/scripts/ingest.ts`

- lit `server/data/raw/**/*.json`
- chunking avec overlap
- embeddings OpenAI
- insertion idempotente dans `content_chunks`
- gestion des erreurs/fichiers invalides (skip)

## Pipeline data (scraper)

Scripts Python:

```text
server/scripts/scraper/
  scrape_urls.py
  download_pdfs.py
  extract_text.py
  structure_content.py
  requirements.txt
  urls.json
  download_report.json
  failed_urls.json
```

Flux:

1. `scrape_urls.py` -> collecte des liens
2. `download_pdfs.py` -> telechargement dans `server/data/pdfs/`
3. `extract_text.py` -> extraction texte vers `server/data/extracted/`
4. `structure_content.py` -> JSON normalises vers `server/data/raw/`

Sources actuellement integrees:

- fomesoutra.com
- banquedesepreuves.com
- epreuvesetcorriges.com
- sujetcorrige.com

Filtrage active: maths + niveau BEPC/3eme + types `annale|exercice|livre`.

## Donnees

- `server/data/pdfs/`: source brute (ignoree par git)
- `server/data/extracted/`: intermediaire extraction (ignoree par git)
- `server/data/raw/`: dataset structure (versionne)

## Prerequis

- Node.js 20+
- pnpm 10+
- Python 3.10+
- PostgreSQL avec extension pgvector
- cle OpenAI valide

## Variables d'environnement

Le projet charge `.env` a plusieurs niveaux pour faciliter le dev local.  
Variables minimales:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notria
OPENAI_API_KEY=sk-...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SERVER_PORT=4001
CLIENT_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4001
```

## Installation

```bash
pnpm install
python -m pip install -r server/scripts/scraper/requirements.txt
```

## Commandes utiles

### Dev

```bash
pnpm dev
pnpm dev:server
pnpm dev:client
```

### DB

```bash
pnpm db:generate
pnpm db:push
pnpm db:studio
```

### Scraping / dataset

```bash
python server/scripts/scraper/scrape_urls.py
python server/scripts/scraper/download_pdfs.py
python server/scripts/scraper/extract_text.py
python server/scripts/scraper/structure_content.py
```

### Ingestion RAG

```bash
pnpm --filter @notria/server ingest:rag
```

### Test endpoint RAG

```bash
curl -X POST http://localhost:4001/api/rag/search \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"theoreme de pythagore triangle rectangle\",\"limit\":5}"
```

## Workflow Git recommande

- branche `main`: pas de push direct
- branches: `feat/...`, `fix/...`, `chore/...`, `refactor/...`
- commits format:
  - `feat(scope): description`
  - `fix(scope): description`
- PR obligatoire avant merge
- pas de secrets dans git

## Etat actuel du sprint RAG

- schema pgvector: en place
- endpoint `/api/rag/search`: en place
- scraper multi-sources: en place
- ingestion operationnelle: en place (avec skip fichiers invalides)
- dataset raw BEPC maths: en place et versionne

## Notes

- Certains fichiers PDF/JSON peuvent etre invalides (scan vide, caracteres null, format incomplet).
- Le pipeline est concu pour continuer en mode resilient (skip + log), pas pour s'arreter completement.
