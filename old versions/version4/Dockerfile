# ─── Stage 1: Build the React frontend ───────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy only package files first for cache-friendly layer
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build production bundle
COPY . .
RUN npm run build

# ─── Stage 2: Build the backend ──────────────────────────────────
FROM node:20-alpine AS backend-build
WORKDIR /server

COPY server/package.json server/package-lock.json ./
RUN npm ci --prefer-offline --production

# ─── Stage 3: Production image ───────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install a lightweight static file server for the frontend
RUN npm install -g serve@14

# Copy backend
COPY --from=backend-build /server/node_modules /app/server/node_modules
COPY server/ /app/server/

# Copy frontend build output
COPY --from=frontend-build /app/dist /app/dist

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting HEALTH-AI Learning Tool..."' >> /app/start.sh && \
    echo 'echo "   Backend:  http://localhost:3001"' >> /app/start.sh && \
    echo 'echo "   Frontend: http://localhost:3000"' >> /app/start.sh && \
    echo 'node /app/server/index.js &' >> /app/start.sh && \
    echo 'serve -s /app/dist -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost:3001/api/health || exit 1

CMD ["/app/start.sh"]
