# Guide: How to Create a New Module in Bitobbu Backend

This guide documents step by step how to create a new module following the project's established architecture.

---

## General Architecture

Each module follows the **Domain → Application → Infrastructure** structure:

```
src/modules/{moduleName}/
├── domain/                     # Pure business rules
│   ├── entities/               # Entity classes
│   ├── repositories/           # Interfaces (contracts)
│   └── errors/                 # Domain errors
├── application/                # Use cases
│   └── dtos/                   # Joi schemas (Request/Response)
└── infrastructure/             # Concrete implementations
    ├── persistence/            # Prisma repositories
    └── http/                   # Fastify routes
```

> [!IMPORTANT]
> Use cases instantiate their own dependencies internally (Prisma repositories and other use cases). They are **NOT injected** from the routing layer.

---

## Step 1: Define the Model in Prisma

Edit `prisma/schema.prisma` and add the corresponding model.

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

Then generate the Prisma client:

```bash
npx prisma generate
npx prisma db push   # or npx prisma migrate dev --name add_products
```

> [!CAUTION]
> Field names in Prisma (`snake_case`) must match **exactly** with those used in the persistence repositories. Always verify the schema before writing the repository.

---

## Step 2: Create the Domain Entity

File: `src/modules/{moduleName}/domain/entities/{entity}.entity.ts`

```typescript
// src/modules/products/domain/entities/product.entity.ts

export class Product {
    constructor(
        public id: string,
        public company_id: string,
        public name: string,
        public description: string | null = null,
        public price: number = 0,
        public is_active: boolean = true,
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
```

**Rules:**
- Use `constructor` with public properties
- Optional/nullable fields must have default values (`null`, `false`, etc.)
- Field names must correspond to the Prisma table

---

## Step 3: Create the Repository Interface

File: `src/modules/{moduleName}/domain/repositories/{entity}.repository.ts`

```typescript
// src/modules/products/domain/repositories/product.repository.ts
import { Product } from "../entities/product.entity";

export interface ProductRepository {
    create(product: Partial<Product>): Promise<Product>;
    findById(id: string): Promise<Product | null>;
    findByCompanyId(companyId: string): Promise<Product[]>;
    update(id: string, product: Partial<Product>): Promise<Product>;
    delete(id: string): Promise<void>;
}
```

**Rules:**
- The entity import points to `../entities/{entity}.entity`
- Define only the methods that are actually needed
- Use `Partial<Entity>` for create/update

---

## Step 4: Create Domain Errors

File: `src/modules/{moduleName}/domain/errors/{module}.errors.ts`

```typescript
// src/modules/products/domain/errors/product.errors.ts
import { ApplicationError } from "../../../../shared/domain/error";

export class ProductNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Product with ID ${id} not found`);
    }
}

export class DuplicateProductError extends ApplicationError {
    constructor(name: string) {
        super(409, `Product "${name}" already exists`);
    }
}
```

**Rules:**
- Always extend from `ApplicationError`
- Use appropriate HTTP codes: `404` (not found), `409` (conflict), `403` (forbidden)

---

## Step 5: Implement the Prisma Repository

File: `src/modules/{moduleName}/infrastructure/persistence/Prisma{Entity}Repository.ts`

```typescript
// src/modules/products/infrastructure/persistence/PrismaProductRepository.ts
import { ProductRepository } from "../../domain/repositories/product.repository";
import { Product } from "../../domain/entities/product.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaProductRepository implements ProductRepository {
    async create(product: Partial<Product>): Promise<Product> {
        const created = await prisma.product.create({
            data: {
                company_id: product.company_id!,
                name: product.name!,
                description: product.description ?? null,
                price: product.price ?? 0,
                is_active: product.is_active ?? true,
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Product | null> {
        const found = await prisma.product.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<Product[]> {
        const list = await prisma.product.findMany({
            where: { company_id: companyId }
        });
        return list.map((item: any) => this.mapToEntity(item));
    }

    async update(id: string, product: Partial<Product>): Promise<Product> {
        const updated = await prisma.product.update({
            where: { id },
            data: {
                // Use conditional spreading to avoid
                // exactOptionalPropertyTypes errors
                ...(product.name !== undefined && { name: product.name }),
                ...(product.description !== undefined
                    && { description: product.description }),
                ...(product.price !== undefined && { price: product.price }),
                ...(product.is_active !== undefined
                    && { is_active: product.is_active }),
            }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.product.delete({ where: { id } });
    }

    private mapToEntity(db: any): Product {
        return new Product(
            db.id,
            db.company_id,
            db.name,
            db.description,
            Number(db.price),
            db.is_active,
            db.created_at,
            db.updated_at
        );
    }
}
```

> [!WARNING]
> **Critical field rule:** The names used in Prisma's `data` object must be **exactly** those from `schema.prisma`, NOT those from the domain entity. If the entity says `state` but Prisma says `location_state`, use `location_state` in the repository.

**Rules:**
- Import `prisma` from `shared/infrastructure/database`
- Use `mapToEntity()` to convert DB records to domain entities
- In `create`: use `??` (nullish coalescing) for default values
- In `update`: use **conditional spreading** (`...(field !== undefined && { field })`) to avoid passing `undefined` to Prisma

---

## Step 6: Create DTOs (Joi Schemas)

File: `src/modules/{moduleName}/application/dtos/{entity}.dto.ts`

```typescript
// src/modules/products/application/dtos/product.dto.ts
import Joi from "joi";

// --- Request Schemas ---
export const createProductDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(500).allow(null, '').optional(),
    price: Joi.number().precision(2).min(0).required(),
    is_active: Joi.boolean().default(true),
});

export const updateProductDtoRequestSchema = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(500).allow(null, '').optional(),
    price: Joi.number().precision(2).min(0).optional(),
    is_active: Joi.boolean().optional(),
});

// --- Response Schemas ---
export const productDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().allow(null).optional(),
    price: Joi.number().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const productListDtoResponseSchema = Joi.array()
    .items(productDtoResponseSchema);
```

**Rules:**
- Separate **Request** and **Response** schemas
- Response schemas: always use `.options({ stripUnknown: true })` for sanitization
- Optional fields: use `.allow(null, '').optional()`
- UUID fields: use `Joi.string().uuid()`

---

## Step 7: Create Use Cases

Each use case extends `UseCase<TInput, TOutput>` and defines:
- `inputSchema`: Joi input validation
- `outputSchema`: Joi output validation
- `implementation()`: business logic

### Example: Create

File: `src/modules/{moduleName}/application/create{Entity}UseCase.ts`

```typescript
// src/modules/products/application/createProductUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { ProductRepository } from "../domain/repositories/product.repository";
import { PrismaProductRepository } from "../infrastructure/persistence/PrismaProductRepository";
import { createProductDtoRequestSchema, productDtoResponseSchema }
    from "./dtos/product.dto";
import Joi from "joi";

interface CreateProductDto {
    company_id: string;
    name: string;
    description?: string;
    price: number;
    is_active?: boolean;
}

interface ProductResult {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    price: number;
    is_active: boolean;
}

export class CreateProductUseCase
    extends UseCase<CreateProductDto, ProductResult> {

    protected inputSchema: Joi.Schema = createProductDtoRequestSchema;
    protected outputSchema: Joi.Schema = productDtoResponseSchema;
    private readonly productRepository: ProductRepository;

    constructor() {
        super();
        this.productRepository = new PrismaProductRepository();
    }

    protected async implementation(
        data: CreateProductDto
    ): Promise<ProductResult> {
        const created = await this.productRepository.create(data);
        return {
            id: created.id,
            company_id: created.company_id,
            name: created.name,
            description: created.description,
            price: created.price,
            is_active: created.is_active,
        };
    }
}
```

### Example: Get by ID

```typescript
// src/modules/products/application/getProductByIdUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { ProductRepository } from "../domain/repositories/product.repository";
import { PrismaProductRepository }
    from "../infrastructure/persistence/PrismaProductRepository";
import { ProductNotFoundError }
    from "../domain/errors/product.errors";
import { productDtoResponseSchema } from "./dtos/product.dto";
import Joi from "joi";

export class GetProductByIdUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = productDtoResponseSchema;
    private readonly productRepository: ProductRepository;

    constructor() {
        super();
        this.productRepository = new PrismaProductRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const product = await this.productRepository.findById(id);
        if (!product) throw new ProductNotFoundError(id);
        return product;
    }
}
```

### Example: Using Another Use Case Internally

If a use case needs functionality from **another module**, import the use case directly:

```typescript
// Example: CreateOrderUseCase needs to verify that the product exists
import { GetProductByIdUseCase }
    from "../../products/application/getProductByIdUseCase";

export class CreateOrderUseCase extends UseCase<CreateOrderDto, OrderResult> {
    // ...
    private readonly getProductUseCase: GetProductByIdUseCase;

    constructor() {
        super();
        this.orderRepository = new PrismaOrderRepository();
        this.getProductUseCase = new GetProductByIdUseCase();
    }

    protected async implementation(data: CreateOrderDto): Promise<OrderResult> {
        // Verify that the product exists
        const product = await this.getProductUseCase.execute(data.product_id);
        // ... order logic
    }
}
```

> [!IMPORTANT]
> **Never import a repository from another module directly.** If you need data from another module, import its **use case**.

---

## Step 8: Create HTTP Routes

File: `src/modules/{moduleName}/infrastructure/http/{module}Routes.ts`

```typescript
// src/modules/products/infrastructure/http/productRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse }
    from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware }
    from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { CreateProductUseCase }
    from '../../application/createProductUseCase';
import { GetProductByIdUseCase }
    from '../../application/getProductByIdUseCase';

export async function productRoutes(app: FastifyInstance) {

    // POST /products (JWT protected)
    app.post('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateProductUseCase();
            const result = await useCase.execute({
                ...request.body,
                company_id: request.user.companyId
                // ^ If you need JWT info
            });
            return ApiResponse.success(
                reply, result, "Product created", 201
            );
        }
    );

    // GET /products/:id (public or protected)
    app.get('/:id',
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            const useCase = new GetProductByIdUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Product found");
        }
    );

    // PATCH /products/:id (JWT protected)
    app.patch('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new UpdateProductUseCase();
            const result = await useCase.execute({
                ...request.body,
                id: request.params.id
            });
            return ApiResponse.success(reply, result, "Product updated");
        }
    );

    // DELETE /products/:id (JWT protected)
    app.delete('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new DeleteProductUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Product removed");
        }
    );
}
```

**Route rules:**
- **JWT required**: Every route that modifies data (`POST`, `PATCH`, `DELETE`) must use `{ preHandler: [authMiddleware] }`
- Public GET routes: can omit the middleware
- Use cases are instantiated with `new UseCase()` without arguments
- Use `ApiResponse.success()` and `ApiResponse.error()` from `responseFormatter`
- Access JWT data: `request.user.userId`, `request.user.email`

---

## Step 9: Register the Routes

Edit `src/routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { userRoutes } from "./modules/users/infrastructure/http/userRoutes";
import { companyRoutes }
    from "./modules/companies/infrastructure/http/companyRoutes";
import { productRoutes }
    from "./modules/products/infrastructure/http/productRoutes";  // NEW

export async function routes(app: FastifyInstance) {
    app.register(userRoutes, { prefix: '/users' });
    app.register(companyRoutes, { prefix: '/companies' });
    app.register(productRoutes, { prefix: '/products' });  // NEW
}
```

Routes will be available under `/api/v1/products/...`

---

## Step 10: Verify

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Compile TypeScript
npx tsc --noEmit

# 3. Run server
npm run dev
```

---

## Quick Checklist

| # | Step | File |
|---|------|------|
| 1 | Prisma Model | `prisma/schema.prisma` |
| 2 | Domain Entity | `domain/entities/{entity}.entity.ts` |
| 3 | Repository Interface | `domain/repositories/{entity}.repository.ts` |
| 4 | Domain Errors | `domain/errors/{module}.errors.ts` |
| 5 | Prisma Repository | `infrastructure/persistence/Prisma{Entity}Repository.ts` |
| 6 | DTOs (Joi schemas) | `application/dtos/{entity}.dto.ts` |
| 7 | Use Cases | `application/{action}{Entity}UseCase.ts` |
| 8 | HTTP Routes | `infrastructure/http/{module}Routes.ts` |
| 9 | Register Routes | `src/routes.ts` |
| 10 | Verify | `npx tsc --noEmit` |

---

## Common Mistakes to Avoid

1. **Importing a repository from another module**: Import the **use case**, not the repository
2. **Prisma field names ≠ Entity field names**: Always verify `schema.prisma` before writing the repository
3. **Passing `undefined` to Prisma**: Use conditional spreading or `??` for default values
4. **Forgetting `authMiddleware`**: Every route that modifies data must have JWT
5. **Not using `stripUnknown`** in response schemas: Response DTOs must always include `.options({ stripUnknown: true })`
6. **Forgetting to register in `routes.ts`**: Without this, routes are not accessible
