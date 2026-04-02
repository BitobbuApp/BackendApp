# Bitobbu Backend — Development Rules

This directory contains the development rules and conventions for the BackendApp project.
Every AI agent or developer **must read the relevant rule file before writing any code**.

## Rule Files

| File | Scope | When to Read |
|------|-------|--------------|
| `architecture.md` | Project structure, module layout, layer boundaries | Before creating a new module or modifying the project structure |
| `use-cases.md` | Use case patterns, validation, cross-module communication | Before writing or modifying any use case |
| `persistence.md` | Prisma repositories, database access, error handling | Before writing or modifying any repository or database code |
| `http.md` | Routes, middleware, API responses | Before writing or modifying any HTTP route |
| `naming.md` | File naming, variable naming, conventions | Always — before writing any new file |
| `database.md` | Prisma schema, migrations, enum strategy | Before modifying `schema.prisma` or creating migrations |

## Architecture Overview

```
src/
├── index.ts                    # Entry point
├── server.ts                   # Fastify app configuration
├── routes.ts                   # Route registration
├── shared/                     # Cross-cutting concerns
│   ├── application/            # Base UseCase class
│   ├── domain/                 # Base errors (ApplicationError, ValidationError)
│   └── infrastructure/         # Database, logger, HTTP utilities, middleware
└── modules/                    # Feature modules (DDD-inspired)
    └── {moduleName}/
        ├── domain/             # Pure business rules
        │   ├── entities/       # Entity classes
        │   ├── repositories/   # Interfaces (contracts)
        │   └── errors/         # Domain-specific errors
        ├── application/        # Use cases + DTOs
        │   └── dtos/           # Joi validation schemas
        └── infrastructure/     # Concrete implementations
            ├── persistence/    # Prisma repository implementations
            └── http/           # Fastify route handlers
```

## Tech Stack

- **Runtime:** Node.js v20+ with TypeScript (via `tsx`)
- **Framework:** Fastify v5
- **ORM:** Prisma v7 (with `@prisma/adapter-pg`)
- **Database:** PostgreSQL (Supabase)
- **Validation:** Joi v18
- **Auth:** JWT (jsonwebtoken + bcrypt)
- **Logging:** Pino + pino-pretty
- **Realtime:** Socket.io
