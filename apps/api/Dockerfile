# syntax=docker/dockerfile:1
# Image de l'API NestJS. À builder DEPUIS LA RACINE du repo :
#   docker build -f apps/api/Dockerfile .
# (le build a besoin de packages/shared, hors du dossier apps/api)
 
# ---- Base commune ----
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo
 
# ---- Étape build : install + compilation ----
FROM base AS build

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# --ignore-scripts : les postinstall du workspace (tsc de shared, prisma
# generate de l'api) ont besoin de sources pas encore copiées à ce stade ;
# ils sont relancés explicitement ci-dessous une fois les sources en place.
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter shared build && pnpm --filter api build
RUN pnpm --filter api deploy --prod --ignore-scripts /app
# Le node_modules recréé par `pnpm deploy` ne contient pas le client Prisma
# généré : on le régénère en ciblant le schéma copié dans /app.
RUN pnpm --filter api exec prisma generate --schema=/app/prisma/schema.prisma
 
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000

CMD ["node", "dist/main.js"]