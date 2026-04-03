# Database & Prisma Schema Rules

## Prisma Schema Conventions

### Model Definition

```prisma
model Product {
    id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    company_id  String   @db.Uuid
    name        String   @db.VarChar(200)
    description String?
    price       Decimal  @db.Decimal(12, 2)
    is_active   Boolean  @default(true)
    created_at  DateTime @default(now()) @db.Timestamptz
    updated_at  DateTime @default(now()) @db.Timestamptz

    company Company @relation(fields: [company_id], references: [id], onDelete: Cascade)

    @@map("products")
}
```

### Mandatory Rules

1. **Primary keys**: Always `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
2. **Table mapping**: Always include `@@map("table_name")` in snake_case
3. **Timestamps**: Use `@db.Timestamptz` for all DateTime fields (timezone-aware)
4. **Foreign keys**: Always specify `@db.Uuid` for UUID references
5. **Field names**: Use `snake_case` to match PostgreSQL conventions

## Enum Strategy

### Workflow Status Enums → SMALLINT

Status enums with natural ordering are stored as `Int @db.SmallInt` in Prisma and mapped to TypeScript enum constants:

```prisma
// In schema.prisma
model Request {
    status  Int  @db.SmallInt  // 0=Active, 1=Paused, etc.
}
```

```typescript
// In src/constants/enums.ts
export enum RequestStatus {
    Active       = 0,
    Paused       = 1,
    Expired      = 2,
    Completed    = 3,
    ExpiringSoon = 4,
    Closed       = 5,
}
```

### Categorical Enums → Lookup Tables

Business entities that may grow or need metadata are stored as lookup tables:

```prisma
model Category {
    id        Int      @id @default(autoincrement()) @db.SmallInt
    name      String   @db.VarChar(100)
    slug      String   @unique @db.VarChar(100)
    isActive  Boolean  @default(true) @map("is_active")
    @@map("categories")
}
```

### Current Lookup Tables

| Table | Replaces Enum | Used By |
|-------|--------------|---------|
| `categories` | `CategoryType` | companies, offers, requests |
| `company_types` | `CompanyType` | companies, offers |
| `payment_methods` | `PaymentMethod` | company_payment_methods, subscriptions, transactions |
| `units_of_measure` | `UnitOfMeasure` | offers, requests |
| `notification_types` | `NotificationType` | notifications |
| `verif_doc_types` | `VerifDocType` | verification_documents |

### Enum Naming Rules

- **All enum keys must be ASCII-only.** No accents, no `ñ`, no special characters.
- Display names with accents belong in lookup table `name` columns or frontend label maps.

## Geographic Tables

```
countries → states → cities
```

- `City` does NOT have a direct `country_id`. Country is reachable via `city → state → country`.
- Use Prisma's `include` for nested access: `include: { city: { include: { state: { include: { country: true } } } } }`

## Migration Rules

### Prisma-managed migrations

```bash
# Generate and apply
npx prisma migrate dev --name descriptive_name

# Generate without applying (for raw SQL edits)
npx prisma migrate dev --create-only --name descriptive_name
```

### Raw SQL migrations

Use `--create-only` when you need to add:
- Partial/conditional indexes (Prisma doesn't support these)
- CHECK constraints
- Triggers or functions
- Data backfills

Then edit the generated `.sql` file before running `npx prisma migrate dev`.

### Before Any Migration

1. Confirm `prisma` and `@prisma/client` are on the same version
2. Run `npx prisma generate` to verify schema is valid
3. Take a backup if touching production data

## Common Prisma Gotchas

1. **Decimal fields**: Prisma returns `Prisma.Decimal` objects, always convert with `Number()` in `mapToEntity()`
2. **`undefined` vs `null`**: Prisma treats them differently. Use conditional spreading in updates.
3. **Computed/generated columns**: Add `@default(dbgenerated("0"))` to prevent Prisma from requiring values on insert
4. **`relationLoadStrategy: 'join'`**: Use on `findUnique` with multiple includes to reduce round-trips
