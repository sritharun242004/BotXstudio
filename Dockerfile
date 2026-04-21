# ─── Stage 1: Build Frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src ./src
COPY public ./public

RUN npm run build

# ─── Stage 2: Build Backend ──────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ─── Stage 3: Production Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install server production dependencies
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# Prisma client
COPY server/prisma ./prisma
RUN npx prisma generate

# Backend compiled output
COPY --from=backend-builder /app/server/dist ./dist

# Frontend static build (served by Express in production)
COPY --from=frontend-builder /app/client/docs ./client

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
