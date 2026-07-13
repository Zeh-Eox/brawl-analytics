# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5000
# Background-capture store — persisted here (declare a volume to keep it).
ENV DATA_DIR=/app/data
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Writable data dir owned by the unprivileged runtime user.
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 5000

# Le proxy expose GET /health (ne tape pas l'API Supercell).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["npm", "start"]
