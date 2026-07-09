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
RUN pnpm install --frozen-lockfile
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter shared build && pnpm --filter api build
RUN pnpm --filter api deploy --prod /app
 
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000

CMD ["node", "dist/main.js"]