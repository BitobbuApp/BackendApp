# Naming Conventions

## File Naming

| Layer | Pattern | Example |
|-------|---------|---------|
| Domain Entity | `{entity}.entity.ts` | `company.entity.ts` |
| Domain Repository Interface | `{entity}.repository.ts` | `company.repository.ts` |
| Domain Errors | `{module}.errors.ts` | `company.errors.ts` |
| Prisma Repository | `Prisma{Entity}Repository.ts` | `PrismaCompanyRepository.ts` |
| Use Case | `{action}{Entity}UseCase.ts` | `createCompanyUseCase.ts` |
| DTO (Joi schemas) | `{entity}.dto.ts` | `company.dto.ts` |
| HTTP Routes | `{module}Routes.ts` | `companyRoutes.ts` |

## Module Directory Naming

- Use **camelCase** for module folder names: `companyOffers`, `quote_responses`, `unitsMeasure`
- Keep module names consistent with their Prisma model names where possible

## Class Naming

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `PascalCase` | `Company`, `QuoteResponse` |
| Repository Interface | `{Entity}Repository` | `CompanyRepository` |
| Prisma Repository | `Prisma{Entity}Repository` | `PrismaCompanyRepository` |
| Use Case | `{Action}{Entity}UseCase` | `CreateCompanyUseCase`, `GetCompanyByIdUseCase` |
| Domain Error | `{Description}Error` | `CompanyNotFoundError`, `DuplicateQuoteResponseError` |
| Route function | `{module}Routes` | `companyRoutes`, `userRoutes` |

## Variable/Field Naming

- **Database fields**: `snake_case` (matches PostgreSQL convention and Prisma schema)
- **TypeScript variables**: `camelCase`
- **Entity properties**: `snake_case` (to match Prisma field names for consistency)
- **Exported Joi schemas**: `{action}{Entity}Dto{Request|Response}Schema`
  - Example: `createCompanyDtoRequestSchema`, `createCompanyDtoResponseSchema`

## Error Class Naming

All domain errors extend `ApplicationError` and follow this pattern:

```typescript
// Pattern: {WhatHappened}Error
export class CompanyNotFoundError extends ApplicationError { ... }
export class CompanyAlreadyExistsError extends ApplicationError { ... }
export class DuplicateQuoteResponseError extends ApplicationError { ... }
```

## HTTP Status Codes in Errors

| Error Type | Status Code |
|-----------|-------------|
| Not found | `404` |
| Already exists / Conflict | `409` |
| Forbidden (authorization) | `403` |
| Validation failed | `400` (handled automatically by `UseCase`) |
| Internal / unexpected | `500` (handled automatically by `errorHandler`) |
