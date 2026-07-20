# syntax=docker/dockerfile:1
# Image du web SvelteKit (SSR via adapter-node). À builder DEPUIS LA RACINE :
#   docker build -f apps/web/Dockerfile --build-arg PUBLIC_API_URL=https://api.reverb-social.com .
# (le build a besoin de packages/shared, hors du dossier apps/web)

# ---- Base commune ----
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- Étape build : install + compilation ----
FROM base AS build
# Résolue statiquement au build par $env/static/public : l'URL de l'API vue
# par le navigateur est figée dans le bundle client, d'où l'ARG obligatoire.
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
# --ignore-scripts : le postinstall de shared (tsc) a besoin de sources pas
# encore copiées à ce stade — même contrainte que le Dockerfile de l'API.
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter shared build && pnpm --filter web build
RUN pnpm --filter web deploy --prod --ignore-scripts /app

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000

# Serveur généré par adapter-node ; configuré au runtime par PORT et ORIGIN
# (protection CSRF), plus API_URL pour les appels SSR vers l'API.
CMD ["node", "build/index.js"]
