# 🚦 Core Principles & Mandatory Checklist

Before writing any code in this project, every developer or AI agent **MUST** verify this checklist. These principles ensure the long-term maintainability and scalability of the Bitobbu Backend.

## 1. The "Inward Only" Rule
Dependencies must flow: **Infrastructure → Application → Domain**.
- Internal layers (Domain) never know about external layers.
- If you find yourself importing a Prisma repo into a Domain Entity, **STOP**.

## 2. No Cross-Module Repository Imports
- **DO NOT** import a Repository from `Module A` into `Module B`.
- Instead, import the **Use Case** from `Module A`.
- This ensures that business logic (validation, logging, side effects) defined in the Use Case is always executed.

## 3. Use Case Autonomy
- Each Use Case is a "black box" that handles its own validation (Input/Output schemas).
- Use cases instantiate their own dependencies in the `constructor`.
- **Aggregator Pattern**: Use cases can (and should) call other Use Cases using `Promise.all` for parallel data fetching or simple `await` for sequential logic.

## 4. Database Integrity
- Use `snake_case` in the database, `camelCase` in TypeScript.
- Always map database records to Domain Entities using `mapToEntity`.
- Never leak Prisma's internal types (`Decimal`, `JSON`, etc.) to the outside world; convert them in the repository.

## 5. Explicit Response Sanitization
- Every Use Case must have an `outputSchema`.
- Always use `.options({ stripUnknown: true })` in response DTOs to prevent accidental leakage of sensitive fields like passwords or internal flags.

---

## ✅ Development Checklist

- [ ] Does my new model in `schema.prisma` follow the project's naming conventions?
- [ ] Have I created a Domain Entity that represents the business object?
- [ ] Is my Use Case inheriting from the base `UseCase` class?
- [ ] Did I remember to instantiate the repository in the Use Case constructor?
- [ ] Are all data-modifying routes (POST, PATCH, DELETE) protected by `authMiddleware`?
- [ ] Does my repository use "conditional spreading" for updates to avoid Prisma errors?
- [ ] Have I registered the new routes in `src/routes.ts`?
