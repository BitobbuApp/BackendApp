# Bitobbu Backend

This is the backend for the Bitobbu B2B Marketplace. It is built using **Fastify**, **Prisma ORM**, and **TypeScript**, following a Pragmatic Domain-Driven Design (DDD) Hexagonal Architecture.

## Architecture & Folder Structure

The application is structured into domain-specific modules to scale effectively and cleanly separate business logic from infrastructure constraints (like HTTP routing or database choices).

```text
src/
├── modules/
│   └── users/                  # All code related to the Users domain
│       ├── application/        # Use cases (business logic orchestration)
│       ├── domain/             # Core Entities and Repository Interfaces
│       └── infrastructure/     # External concerns (Fastify Routes, Prisma Repositories)
├── shared/                     # Global concepts shared across all modules
│   ├── domain/                 # Core shared errors (ApplicationError, ValidationError)
│   └── infrastructure/         # Global HTTP handlers, formatters, and utilities
├── index.ts                    # Application start script
├── routes.ts                   # Global Fastify Route aggregator plugin
└── server.ts                   # Fastify Instance configuration
```

## Setup & Execution

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database Setup:**
   Ensure your `.env` is configured with the `DATABASE_URL`.
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Development Mode:**
   Runs the server using `tsx` with hot-reloading enabled.
   ```bash
   npm run dev
   ```

4. **Production Build:**
   Compiles TypeScript into pure JavaScript.
   ```bash
   npm run build
   npm start
   ```

## Key Technologies

- **Framework**: Fastify (`fastify`)
- **Database ORM**: Prisma (`@prisma/client`)
- **Validation**: Joi (`joi`)
- **Authentication**: Bcrypt (`bcrypt`)
- **Language**: TypeScript (`typescript`, `tsx`)
