# NOTRIA - Tutorat IA pour le BAC/BEPC

Plateforme de tutorat IA pour les élèves ivoiriens préparant le BAC et le BEPC.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 22+
- pnpm 10+
- PostgreSQL (optionnel pour le développement)

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd notria

# Installer les dépendances
pnpm install
```

### Configuration
```bash
# Copier les variables d'environnement
cp server/.env.example server/.env.local

# Éditer server/.env.local avec vos clés API
# - DATABASE_URL (PostgreSQL)
# - OPENAI_API_KEY
# - JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
# - STRIPE_* (pour les paiements)
```

### Démarrage
```bash
# Démarrer le serveur backend (port 3001)
pnpm dev:server

# Démarrer le client frontend (port 3000)
pnpm dev:client

# Ou démarrer les deux en parallèle
pnpm dev
```

### Accès
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 📁 Structure du projet

```
notria/
├── packages/shared/     # Types, validation, constantes partagées
├── client/             # Next.js 15 + Tailwind CSS
├── server/             # Express + TypeScript + Drizzle ORM
└── README.md
```

## 🛠️ Stack technique

- **Frontend**: Next.js 15, React 18, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL
- **IA**: OpenAI GPT-4o-mini
- **Auth**: JWT (access + refresh tokens)
- **Paiement**: Stripe
- **Package manager**: pnpm workspaces

## 📋 Phases de développement

- ✅ **Phase 0**: Bootstrap monorepo
- 🔄 **Phase 1**: Landing page mobile-first
- ⏳ **Phase 2**: Authentification (téléphone +225)
- ⏳ **Phase 3**: Onboarding + Programme long terme + Planning
- ⏳ **Phase 4**: Chat Prof Ada (streaming SSE)
- ⏳ **Phase 5**: Exercices + Devoirs post-séance
- ⏳ **Phase 6**: Dashboard élève
- ⏳ **Phase 7**: Dashboard parent
- ⏳ **Phase 8**: Paiement Stripe

## 🎯 Fonctionnalités principales

- **Prof Ada**: Tutrice IA disponible 24/7
- **Programme d'étude**: Généré par l'IA selon le niveau de l'élève
- **Planning personnalisé**: Emploi du temps adapté à chaque élève
- **Exercices adaptatifs**: Difficulté qui s'ajuste automatiquement
- **Devoirs post-séance**: Générés automatiquement après chaque chat
- **Suivi progression**: Pour élèves et parents
- **Abonnements**: Gratuit, Standard (2000 FCFA/mois), Premium (3500 FCFA/mois)

## 🌍 Cible

Élèves ivoiriens préparant:
- BEPC (3ème)
- BAC (Terminale A1, A2, C, D)

## 📞 Contact

Pour toute question ou suggestion, n'hésitez pas à nous contacter.
