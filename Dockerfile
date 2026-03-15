# ============================================================
# Stage 1: Builder
# Installs ALL deps, generates Prisma client, compiles TS → JS
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Native build tools required by bcrypt (uses node-gyp / C++ bindings)
RUN apk add --no-cache python3 make g++

# Install dependencies first (cached layer if package.json unchanged)
COPY package*.json ./
RUN npm ci

# Copy source and config files
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client against the schema
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build


# ============================================================
# Stage 2: Production
# Lean image — only production deps + compiled output
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Same native tools needed at runtime by bcrypt
RUN apk add --no-cache python3 make g++

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma Client from builder
# (must match the OS/arch of this runner stage)
COPY --from=builder /app/node_modules/.prisma        ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy prisma schema (needed at runtime for some Prisma internals)
COPY prisma ./prisma

# The app listens on PORT (default 5000 per .env)
EXPOSE 5000

# Do NOT run prisma db push here — run migrations as a separate CI/CD step
CMD ["node", "dist/index.js"]
