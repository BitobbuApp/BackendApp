# Architecture Rules

## Module Structure (Mandatory)

Every feature module must follow the **Domain → Application → Infrastructure** layered structure:

```
src/modules/{moduleName}/
├── domain/
│   ├── entities/           # {entity}.entity.ts
│   ├── repositories/       # {entity}.repository.ts (interface only)
│   └── errors/             # {module}.errors.ts
├── application/
│   ├── dtos/               # {entity}.dto.ts (Joi schemas)
│   ├── create{Entity}UseCase.ts
│   ├── get{Entity}ByIdUseCase.ts
│   ├── update{Entity}UseCase.ts
│   ├── delete{Entity}UseCase.ts
│   └── list{Entity}UseCase.ts
└── infrastructure/
    ├── persistence/        # Prisma{Entity}Repository.ts
    └── http/               # {module}Routes.ts
```

## Layer Dependency Rules

### STRICT: Dependencies flow inward only

```
infrastructure → application → domain
```

- **Domain layer** must NOT import from `application/` or `infrastructure/`.
- **Application layer** may import from `domain/` only (entities, repository interfaces, errors).
- **Infrastructure layer** may import from `domain/` and `application/`.

### Cross-module communication

- **NEVER import a repository from another module.**
- If you need data from another module, import its **Use Case** instead.
- Example: `CreateCompanyUseCase` imports `UpdateUserUseCase` from the users module.

```typescript
// ✅ CORRECT: import use case from another module
import { UpdateUserUseCase } from "../../users/application/updateUserUseCase";

// ❌ WRONG: import repository from another module
import { PrismaUserRepository } from "../../users/infrastructure/persistence/PrismaUserRepository";
```

## Shared Layer (`src/shared/`)

The shared layer contains cross-cutting concerns used by all modules:

| Path | Purpose |
|------|---------|
| `shared/application/useCase.ts` | Base `UseCase<TInput, TOutput>` abstract class |
| `shared/domain/error.ts` | `ApplicationError` and `ValidationError` base classes |
| `shared/infrastructure/database.ts` | Prisma client singleton + DB event logging |
| `shared/infrastructure/logger.ts` | Pino logger with pino-pretty |
| `shared/infrastructure/http/responseFormatter.ts` | `ApiResponse.success()` / `ApiResponse.error()` |
| `shared/infrastructure/http/errorHandler.ts` | Global Fastify error handler |
| `shared/infrastructure/http/middlewares/authMiddleware.ts` | JWT authentication middleware |

## Route Registration

Every new module's routes must be registered in `src/routes.ts`:

```typescript
import { productRoutes } from "./modules/products/infrastructure/http/productRoutes";

export async function routes(app: FastifyInstance) {
    // ... existing routes
    app.register(productRoutes, { prefix: '/products' });
}
```

All routes are served under the `/api/v1/` prefix (configured in `server.ts`).
