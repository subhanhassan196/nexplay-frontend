# ─────────────────────────────────────────────────────────────
# NexPlay Frontend — production Dockerfile (Next.js standalone)
# ─────────────────────────────────────────────────────────────

# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_* vars are baked at build time; provide via --build-arg if needed.
RUN npm run build

# Stage 2: minimal runtime using the standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nexplay && adduser -S nexplay -G nexplay

# Standalone output bundles only the files needed to run.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nexplay:nexplay /app/.next/standalone ./
COPY --from=builder --chown=nexplay:nexplay /app/.next/static ./.next/static

USER nexplay

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
