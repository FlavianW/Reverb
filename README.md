# Reverb

Réseau social dédié aux concerts live : pages concerts (setlist, médias, notes, commentaires), profils, recherche et signalement de contenu.

Ce projet sert de support à la certification RNCP39583 — Expert en développement logiciel (Bloc 2). Le contexte complet du projet (périmètre MVP, règles de développement) est documenté dans [`CLAUDE.md`](./CLAUDE.md) ; les user stories détaillées sont dans [`docs/USER-STORIES.md`](./docs/USER-STORIES.md).

## Stack

- **Web** : SvelteKit (SSR) — **Mobile** : Flutter
- **API** : NestJS (TypeScript strict)
- **Données** : PostgreSQL · cache Redis (ElastiCache en production)
- **Médias** : S3 (MinIO en local) + CloudFront en production
- **APIs externes** : Setlist.fm (setlists)

## Prérequis

- Node.js ≥ 20, [pnpm](https://pnpm.io) (via `corepack enable`)
- Docker (pour Postgres et MinIO en local)

## Installation

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker-compose up -d
```

Renseigner dans `apps/api/.env` au minimum `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (OAuth) et `SETLISTFM_API_KEY` (setlists) si vous testez ces fonctionnalités.

## Base de données

```bash
pnpm --filter api exec prisma migrate dev   # applique les migrations
pnpm --filter api exec prisma db seed       # jeu de données de démonstration
```

Le seed crée un compte de démonstration (`demo@reverb.fr` / `password123`) et deux concerts.

## Lancer le projet

```bash
pnpm --filter api start:dev   # API sur http://localhost:3000
pnpm --filter web dev         # Web (à venir)
```

Mobile : `flutter run` depuis `apps/mobile`.

## Tests et qualité

```bash
pnpm --filter api test        # tests unitaires
pnpm --filter api test:e2e    # tests end-to-end (nécessite Postgres démarré)
pnpm -r lint
```

## Build

```bash
pnpm --filter api build
docker build -f apps/api/Dockerfile .   # image API (build depuis la racine, requis pour packages/shared)
```
