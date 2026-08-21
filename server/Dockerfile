# syntax=docker/dockerfile:1

# ---- dependencies -------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# ci installs exactly what the lockfile pins; omit-dev drops nodemon.
RUN npm ci --omit=dev

# ---- runtime ------------------------------------------------------
FROM node:20-alpine AS runner
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY index.js ./
COPY src ./src
# SQL migrations are applied at boot by drizzle-orm's runtime migrator.
COPY drizzle ./drizzle

# node:alpine ships an unprivileged `node` user — never run the API as root.
USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
