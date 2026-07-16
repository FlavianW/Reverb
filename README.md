# Reverb

Réseau social dédié aux concerts live : pages concerts (setlist, médias, notes, commentaires), profils, recherche et signalement de contenu.

Ce projet sert de support à la certification RNCP39583 — Expert en développement logiciel (Bloc 2).

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
pnpm --filter web dev         # Web sur http://localhost:5173
```

Mobile : `flutter run` depuis `apps/mobile`.

## Médias (S3)

`apps/api/src/media/s3.service.ts` est agnostique entre MinIO et un vrai bucket AWS S3 (même API, `forcePathStyle` compatible avec les deux). En local, MinIO (`docker-compose up -d`) suffit et ne nécessite aucun compte AWS.

Pour utiliser un vrai bucket S3 (déploiement, démonstration) :

1. **Bucket** : créer un bucket S3 (espace de noms global, nom unique) dans la région souhaitée. Garder "Block all public access" activé pour les ACL, mais autoriser les bucket policies publiques.
2. **Utilisateur IAM dédié** : créer un utilisateur avec accès programmatique uniquement (pas d'accès console), et une policy inline limitée à ce bucket :
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::<nom-du-bucket>/*"
       }
     ]
   }
   ```
3. **Bucket policy en lecture publique** (les photos sont servies par URL directe) :
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadPhotos",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::<nom-du-bucket>/*"
       }
     ]
   }
   ```
4. Renseigner dans `apps/api/.env` : `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` (`https://<bucket>.s3.<region>.amazonaws.com`), et laisser `S3_ENDPOINT` vide.

En production, l'architecture cible remplace l'accès public direct par CloudFront + Origin Access Control (bucket resté privé) — voir `CLAUDE.md`.

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
