# Persistence (Repository) Rules

## Prisma Client

Always import the Prisma client singleton from the shared infrastructure:

```typescript
import { prisma } from '../../../../shared/infrastructure/database';
```

**NEVER** instantiate a new `PrismaClient`. The singleton handles connection pooling and event logging.

## Repository Pattern

### Interface (Domain Layer)

Define a repository interface in `domain/repositories/`:

```typescript
import { Product } from "../entities/product.entity";

export interface ProductRepository {
    create(product: Partial<Product>): Promise<Product>;
    findById(id: string): Promise<Product | null>;
    update(id: string, product: Partial<Product>): Promise<Product>;
    delete(id: string): Promise<void>;
}
```

- Use `Partial<Entity>` for `create` and `update` signatures.
- Only define the methods you actually need.

### Implementation (Infrastructure Layer)

The Prisma repository **implements** the domain interface:

```typescript
export class PrismaProductRepository implements ProductRepository {
    // ... methods
    private mapToEntity(db: any): Product { ... }
}
```

## Critical Field Name Rule

> **Prisma field names ≠ Entity field names sometimes.**

The names used in Prisma's `data` object must be **exactly** those from `schema.prisma`, NOT those from the domain entity. Always verify the schema before writing the repository.

## `mapToEntity()` Pattern

Every Prisma repository must have a `private mapToEntity()` method that converts DB records to domain entities:

```typescript
private mapToEntity(db: any): Product {
    return new Product(
        db.id,
        db.company_id,
        db.name,
        db.description,
        Number(db.price),       // Convert Decimal to number
        db.is_active,
        db.created_at,
        db.updated_at
    );
}
```

**Important conversions:**
- `Decimal` fields → `Number(db.field)`
- Lookup table relations → `db.relation_ref?.name ?? null`

## Create Operations

Use `??` (nullish coalescing) for default values:

```typescript
async create(product: Partial<Product>): Promise<Product> {
    const created = await prisma.product.create({
        data: {
            name: product.name!,
            description: product.description ?? null,
            price: product.price ?? 0,
            is_active: product.is_active ?? true,
        }
    });
    return this.mapToEntity(created);
}
```

## Update Operations

Use **`pickDefined`** from `prismaDataHelpers` to construct update objects cleanly, rather than using manual `undefined` spread checks. This significantly improves readability and reduces visual noise.

```typescript
import { pickDefined } from '../../../../shared/infrastructure/database/prismaDataHelpers';

async update(id: string, product: Partial<Product>): Promise<Product> {
    const rawData = {
        name: product.name,
        price: product.price,
        is_active: product.is_active,
    };

    const data = pickDefined(rawData) as any;

    const updated = await prisma.product.update({
        where: { id },
        data
    });
    return this.mapToEntity(updated);
}
```

## Lookup Table Relations (Connect/Disconnect Pattern)

For FK relations to lookup tables, use the explicitly provided relation helpers from `prismaDataHelpers`: `connectIfPresent` and `connectOrDisconnect`.

```typescript
import { connectOrDisconnect } from '../../../../shared/infrastructure/database/prismaDataHelpers';

// In update (support setting to null or undefined):
const data = pickDefined(rawData) as any;
if (product.sector_id !== undefined) {
    data.sector_ref = connectOrDisconnect(product.sector_id);
}
```

## PR Checklist

- [ ] Prefer shared data helpers (`pickDefined`, `connectOrDisconnect`) over repeated conditional spread blocks.

## Error Handling in Repositories

- **DO** throw domain-specific errors for known Prisma error codes (e.g., `P2002` for unique constraint violations).
- **DO NOT** wrap every method in try/catch — let unknown errors bubble up to the global error handler.

```typescript
// ✅ CORRECT — catch specific Prisma errors, throw domain errors
try {
    const created = await prisma.quoteResponse.create({ data: { ... } });
    return this.mapToEntity(created);
} catch (error: any) {
    if (error.code === 'P2002') {
        throw new DuplicateQuoteResponseError(data.request_id!, data.supplier_id!);
    }
    throw error;  // re-throw unknown errors
}
```

## Pagination Pattern

For paginated list queries, use `Promise.all` with count + findMany:

```typescript
async list(filters: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
        prisma.product.count({ where: filters }),
        prisma.product.findMany({
            where: filters,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' }
        })
    ]);
    return { data: data.map(item => this.mapToEntity(item)), total, page, limit };
}
```

## Race Conditions

For operations that need to read-then-write (e.g., recalculating `total_amount`), wrap in a Prisma transaction:

```typescript
return prisma.$transaction(async (tx) => {
    const existing = await tx.quoteResponse.findUnique({ where: { id } });
    // ... calculate
    const updated = await tx.quoteResponse.update({ where: { id }, data: { ... } });
    return this.mapToEntity(updated);
});
```
