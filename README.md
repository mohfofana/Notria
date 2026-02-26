# NOTRIA - Tutorat IA pour le BAC/BEPC

Plateforme de tutorat IA pour les élèves ivoiriens préparant le BEPC.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 22+
- pnpm 10+
- PostgreSQL 

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

