# Vstroz Alliance — production container (Railway, Render, Fly.io, any Docker host)
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (prisma generate runs via postinstall)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

# Build
COPY . .
RUN npm run build

# The SQLite file lives on a mounted volume at /data (see DATABASE_URL below)
ENV DATABASE_URL="file:/data/vstroz.db"
ENV PORT=3000
EXPOSE 3000

# Create/upgrade tables on boot, then serve
CMD ["sh", "-c", "mkdir -p /data && npx prisma db push --skip-generate && npm run start"]
