# Guía: Cómo Crear un Nuevo Módulo en Bitobbu Backend

Esta guía documenta paso a paso cómo crear un módulo nuevo siguiendo la arquitectura establecida del proyecto.

---

## Arquitectura General

Cada módulo sigue la estructura **Dominio → Aplicación → Infraestructura**:

```
src/modules/{moduleName}/
├── domain/                     # Reglas de negocio puras
│   ├── entities/               # Clases de entidad
│   ├── repositories/           # Interfaces (contratos)
│   └── errors/                 # Errores de dominio
├── application/                # Casos de uso
│   └── dtos/                   # Esquemas Joi (Request/Response)
└── infrastructure/             # Implementaciones concretas
    ├── persistence/            # Repositorios Prisma
    └── http/                   # Rutas Fastify
```

> [!IMPORTANT]
> Los casos de uso instancian sus propias dependencias internamente (repositorios Prisma y otros use cases). **NO se inyectan** desde las rutas.

---

## Paso 1: Definir el Modelo en Prisma

Editar [prisma/schema.prisma](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/prisma/schema.prisma) y agregar el modelo correspondiente.

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

Luego generar el cliente Prisma:

```bash
npx prisma generate
npx prisma db push   # o npx prisma migrate dev --name add_products
```

> [!CAUTION]
> Los nombres de los campos en Prisma (`snake_case`) deben coincidir **exactamente** con los que uses en los repositorios de persistencia. Verifica siempre el schema antes de escribir el repositorio.

---

## Paso 2: Crear la Entidad de Dominio

Archivo: `src/modules/{moduleName}/domain/entities/{entity}.entity.ts`

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

**Reglas:**
- Usar [constructor](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/shared/application/services/jwtService.ts#11-14) con propiedades públicas
- Los campos opcionales/nullable deben tener valores por defecto (`null`, `false`, etc.)
- Los nombres de campos deben corresponder a la tabla de Prisma

---

## Paso 3: Crear la Interfaz del Repositorio

Archivo: `src/modules/{moduleName}/domain/repositories/{entity}.repository.ts`

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

**Reglas:**
- El import de la entidad apunta a `../entities/{entity}.entity`
- Definir solo los métodos que realmente se necesitan
- Usar `Partial<Entity>` para create/update

---

## Paso 4: Crear los Errores de Dominio

Archivo: `src/modules/{moduleName}/domain/errors/{module}.errors.ts`

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

**Reglas:**
- Extender siempre de [ApplicationError](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/shared/domain/error.ts#3-9)
- Usar códigos HTTP apropiados: `404` (not found), `409` (conflict), `403` (forbidden)

---

## Paso 5: Implementar el Repositorio Prisma

Archivo: `src/modules/{moduleName}/infrastructure/persistence/Prisma{Entity}Repository.ts`

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
                // Usar conditional spreading para evitar errores de
                // exactOptionalPropertyTypes
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
> **Regla crítica de campos:** Los nombres usados en el objeto `data` de Prisma deben ser **exactamente** los del [schema.prisma](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/prisma/schema.prisma), NO los de la entidad de dominio. Si la entidad dice `state` pero Prisma dice `location_state`, usa `location_state` en el repositorio.

**Reglas:**
- Importar [prisma](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/prisma/schema.prisma) desde `shared/infrastructure/database`
- Usar [mapToEntity()](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/modules/companies/infrastructure/persistence/PrismaLocationRepository.ts#56-67) para convertir registros DB a entidades de dominio
- En [create](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/modules/companies/domain/repositories/company.repository.ts#5-6): usar `??` (nullish coalescing) para valores por defecto
- En [update](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/modules/companies/infrastructure/persistence/PrismaContactRepository.ts#31-44): usar **conditional spreading** (`...(field !== undefined && { field })`) para evitar pasar `undefined` a Prisma

---

## Paso 6: Crear los DTOs (Esquemas Joi)

Archivo: `src/modules/{moduleName}/application/dtos/{entity}.dto.ts`

```typescript
// src/modules/products/application/dtos/product.dto.ts
import Joi from "joi";

// --- Schemas de Request ---
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

// --- Schemas de Response ---
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

**Reglas:**
- Separar schemas de **Request** y **Response**
- Response schemas: siempre usar `.options({ stripUnknown: true })` para sanitizar
- Campos opcionales: usar `.allow(null, '').optional()`
- Campos UUID: usar `Joi.string().uuid()`

---

## Paso 7: Crear los Casos de Uso

Cada caso de uso extiende `UseCase<TInput, TOutput>` y define:
- `inputSchema`: validación Joi de entrada
- `outputSchema`: validación Joi de salida
- [implementation()](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/modules/companies/application/getCompanyByIdUseCase.ts#42-49): lógica de negocio

### Ejemplo: Crear

Archivo: `src/modules/{moduleName}/application/create{Entity}UseCase.ts`

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

### Ejemplo: Obtener por ID

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

### Ejemplo: Usar otro caso de uso internamente

Si un caso de uso necesita funcionalidad de **otro módulo**, se importa el caso de uso directamente:

```typescript
// Ejemplo: CreateOrderUseCase necesita verificar que el producto existe
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
        // Verificar que el producto existe
        const product = await this.getProductUseCase.execute(data.product_id);
        // ... lógica del pedido
    }
}
```

> [!IMPORTANT]
> **Nunca importes un repositorio de otro módulo directamente.** Si necesitas datos de otro módulo, importa su **caso de uso**.

---

## Paso 8: Crear las Rutas HTTP

Archivo: `src/modules/{moduleName}/infrastructure/http/{module}Routes.ts`

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

    // POST /products (protegida con JWT)
    app.post('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateProductUseCase();
            const result = await useCase.execute({
                ...request.body,
                company_id: request.user.companyId
                // ^ Si necesitas info del JWT
            });
            return ApiResponse.success(
                reply, result, "Product created", 201
            );
        }
    );

    // GET /products/:id (pública o protegida)
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

    // PATCH /products/:id (protegida con JWT)
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

    // DELETE /products/:id (protegida con JWT)
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

**Reglas de rutas:**
- **JWT obligatorio**: Toda ruta que modifique datos (`POST`, `PATCH`, `DELETE`) debe usar `{ preHandler: [authMiddleware] }`
- Rutas GET públicas: pueden omitir el middleware
- Los use cases se instancian con `new UseCase()` sin argumentos
- Usar `ApiResponse.success()` y `ApiResponse.error()` del `responseFormatter`
- Acceso a datos del JWT: `request.user.userId`, `request.user.email`

---

## Paso 9: Registrar las Rutas

Editar [src/routes.ts](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/routes.ts):

```typescript
import { FastifyInstance } from "fastify";
import { userRoutes } from "./modules/users/infrastructure/http/userRoutes";
import { companyRoutes }
    from "./modules/companies/infrastructure/http/companyRoutes";
import { productRoutes }
    from "./modules/products/infrastructure/http/productRoutes";  // NUEVO

export async function routes(app: FastifyInstance) {
    app.register(userRoutes, { prefix: '/users' });
    app.register(companyRoutes, { prefix: '/companies' });
    app.register(productRoutes, { prefix: '/products' });  // NUEVO
}
```

Las rutas quedarán disponibles bajo `/api/v1/products/...`

---

## Paso 10: Verificar

```bash
# 1. Generar cliente Prisma
npx prisma generate

# 2. Compilar TypeScript
npx tsc --noEmit

# 3. Ejecutar servidor
npm run dev
```

---

## Checklist Rápido

| # | Paso | Archivo |
|---|------|---------|
| 1 | Modelo Prisma | [prisma/schema.prisma](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/prisma/schema.prisma) |
| 2 | Entidad de dominio | `domain/entities/{entity}.entity.ts` |
| 3 | Interfaz repositorio | `domain/repositories/{entity}.repository.ts` |
| 4 | Errores de dominio | `domain/errors/{module}.errors.ts` |
| 5 | Repositorio Prisma | `infrastructure/persistence/Prisma{Entity}Repository.ts` |
| 6 | DTOs (Joi schemas) | `application/dtos/{entity}.dto.ts` |
| 7 | Casos de uso | `application/{action}{Entity}UseCase.ts` |
| 8 | Rutas HTTP | `infrastructure/http/{module}Routes.ts` |
| 9 | Registrar rutas | [src/routes.ts](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/routes.ts) |
| 10 | Verificar | `npx tsc --noEmit` |

---

## Errores Comunes a Evitar

1. **Importar repositorio de otro módulo**: Importa el **caso de uso**, no el repositorio
2. **Nombres de campos Prisma ≠ Entidad**: Siempre verifica [schema.prisma](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/prisma/schema.prisma) antes de escribir el repositorio
3. **Pasar `undefined` a Prisma**: Usa conditional spreading o `??` para valores por defecto
4. **Olvidar [authMiddleware](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/shared/infrastructure/http/middlewares/authMiddleware.ts#16-41)**: Toda ruta que modifique datos debe tener JWT
5. **No usar `stripUnknown`** en response schemas: Los DTOs de respuesta siempre llevan `.options({ stripUnknown: true })`
6. **Olvidar registrar en [routes.ts](file:///c:/proyectos/personal/bitobbu/backend-bitobbu/src/routes.ts)**: Sin esto, las rutas no son accesibles
