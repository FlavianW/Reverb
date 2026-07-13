# CLAUDE.md — Reverb

## Le projet
Reverb est un réseau social dédié aux concerts live : pages concerts (setlist, médias, notes, commentaires), profils, et chat entre fans. Il sert de support à la certification **RNCP39583 — Expert en développement logiciel (Bloc 2)**.

Deux jurés professionnels externes évalueront **le code source ET l'historique Git**. Tout ce qui est produit doit refléter un travail personnel, structuré, de **niveau Master 2**.

## Stack
- Web : SvelteKit (SSR) — Mobile : Flutter (iOS / Android)
- API : NestJS (TypeScript, mode strict)
- Données : PostgreSQL (RDS) · cache Redis (ElastiCache)
- Médias : S3 + CloudFront (OAC) · transcoding Lambda + FFmpeg
- APIs externes : Last.fm (écoutes) · Setlist.fm (setlists)

## Structure du repo — monorepo
Tout vit dans **un seul repo** (historique Git unique et cohérent, lu par le jury). Les parties TypeScript sont gérées en **pnpm workspaces** ; Flutter est un dossier voisin, hors workspace TS.

```
reverb/
├─ apps/
│  ├─ api/       # NestJS (seul service containerisé)
│  ├─ web/       # SvelteKit (SSR)
│  └─ mobile/    # Flutter (Dart)
├─ packages/
│  └─ shared/    # types TS du contrat d'API, partagés api <-> web
├─ docs/
│  └─ USER-STORIES.md
└─ CLAUDE.md
```

- Le contrat d'API (DTO / types) vit dans `packages/shared` : **source unique de vérité**, jamais dupliqué entre `api` et `web`.
- Un commit peut toucher `api` et `web` ensemble (ex. un endpoint + son UI) — encouragé, ça rend la progression lisible.

### Build & container (AWS)
- Seul **`apps/api`** est containerisé (image Docker → ECR → ECS Fargate). `web` et `mobile` ne vont pas dans cette image.
- **Builder l'image depuis la racine**, jamais depuis `apps/api` (le build a besoin de `packages/shared`) : `docker build -f apps/api/Dockerfile .`
- Dockerfile **multi-stage** + `.dockerignore` strict → l'image finale ne contient que l'API compilée et ses dépendances de prod.

## Périmètre — ne construire QUE le MVP
Développer uniquement ces fonctionnalités « Must ». Le reste est **hors périmètre sauf demande explicite** — ne pas le commencer sans validation.

**MVP (à construire) :**
- Auth : inscription / connexion OAuth + session JWT
- Pages concerts : page enrichie + setlist (Setlist.fm), notation, commentaires
- Recherche concerts / artistes
- Profil personnalisable
- Upload photos (S3)
- Signalement de contenu

**Hors MVP (ne pas démarrer sans accord) :** chat temps réel, upload vidéo / transcoding, fil d'actualité, followers, back-office modérateur, Last.fm, recommandations.

User stories détaillées (format + critères d'acceptation) : voir `docs/USER-STORIES.md`.

## Règles non négociables

### Git & commits
- Committer **au nom de Flavian Waroquier** (`user.name` et `user.email` configurés en conséquence).
- **Jamais** de trailer `Co-Authored-By: Claude`, ni de mention « Generated with Claude Code », ni aucune signature d'outil.
- Avancer **étape par étape** : commits **atomiques** (un commit = un changement cohérent), dans un ordre qui raconte lisiblement la construction du projet — **le jury lira l'historique**.
- Messages en **Conventional Commits**, sujet court en français (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Le projet reste **fonctionnel après chaque commit** : ne jamais committer de code cassé.
- Demander avant tout changement structurant (nouvelle dépendance, refonte, migration de schéma).

### Maintenabilité — priorité absolue
- Séparation claire des responsabilités, modules cohérents, fonctions courtes à responsabilité unique, nommage explicite, zéro duplication.
- Respecter les conventions du framework : structure NestJS (`module` / `service` / `controller` / `dto`), conventions de routing et de composants SvelteKit.
- TypeScript strict : aucun `any` non justifié, aucun code mort, aucun `TODO` laissé.
- Toujours préférer la solution simple et lisible à la solution « maligne ».

### Documentation du code (JSDoc, avec mesure)
- JSDoc sur le **public et le non-trivial** (services, fonctions exportées, types complexes) : but, paramètres, cas limites.
- **Ne pas surcommenter.** Pas de commentaire qui paraphrase le code. Commenter le **pourquoi**, jamais le **quoi** — un bon nommage vaut mieux qu'un commentaire.

## Exigences certification (à tenir dans le code)
- **Sécurité (éliminatoire C2.2.3)** : couvrir le **Top 10 OWASP** — validation des entrées, requêtes paramétrées via l'ORM, auth JWT + hash bcrypt, secrets en variables d'environnement, CORS maîtrisé.
- **Accessibilité** : viser le **RGAA niveau AA** — contrastes, navigation clavier, `alt`, rôles ARIA, HTML sémantique.
- **Tests (éliminatoire C2.2.2)** : tests unitaires (Jest côté NestJS) sur le cœur métier ; couverture **utile**, pas 100 % partout.
- Chaque fonctionnalité livrée doit pouvoir entrer dans le **cahier de recettes** (scénario → attendu → obtenu → OK/KO — éliminatoire C2.3.1).

## Architecture
API en entrée via **ALB → ECS Fargate (NestJS)** pour l'API et le WebSocket ; médias via **CloudFront → S3**. Le déploiement noté = un **MVP réellement fonctionnel et accessible** ; l'architecture AWS complète est documentée comme **cible de production**, pas à provisionner en entier.

## Design
Suivre l'identité visuelle établie (palette, typographie, nommage des composants). **Réutiliser les composants existants avant d'en créer de nouveaux.**

## Commandes
> Toutes les commandes `pnpm` se lancent à la racine du repo.
- Install : `pnpm install`
- API (dev) : `pnpm --filter api start:dev`
- Web (dev) : `pnpm --filter web dev`
- Mobile (dev) : `flutter run` (depuis `apps/mobile`)
- Tests : `pnpm --filter api test`
- Lint : `pnpm -r lint`
- Build API : `pnpm --filter api build`
- Image API : `docker build -f apps/api/Dockerfile .`