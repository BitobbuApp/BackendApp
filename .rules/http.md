# HTTP (Routes) Rules

## Route File Structure

Every module has a single route file at:
`src/modules/{moduleName}/infrastructure/http/{module}Routes.ts`

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

export async function productRoutes(app: FastifyInstance) {
    // POST /products — create (protected)
    app.post('/', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new CreateProductUseCase();
        const result = await useCase.execute({ ...request.body, company_id: request.user.companyId });
        return ApiResponse.success(reply, result, "Product created", 201);
    });

    // GET /products/:id — read (public or protected)
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new GetProductByIdUseCase();
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Product found");
    });
}
```

## Authentication Rules

| HTTP Method | Requires JWT? | Middleware |
|-------------|--------------|-----------|
| `POST` | ✅ **Always** | `{ preHandler: [authMiddleware] }` |
| `PATCH` / `PUT` | ✅ **Always** | `{ preHandler: [authMiddleware] }` |
| `DELETE` | ✅ **Always** | `{ preHandler: [authMiddleware] }` |
| `GET` | ⚠️ Depends on the resource | Add middleware only if data is private |

## JWT Data Access

After `authMiddleware` runs, the decoded JWT is available at `request.user`:

```typescript
request.user.userId      // string — the authenticated user's UUID
request.user.companyId   // string | null — the user's associated company
request.user.email       // string — the user's email
```

## API Response Format

Always use `ApiResponse` from `shared/infrastructure/http/responseFormatter`:

```typescript
// Success response (default 200)
ApiResponse.success(reply, data, "Success message");

// Success with custom status
ApiResponse.success(reply, data, "Created", 201);

// Error response
ApiResponse.error(reply, "Error message", 400, errors);
```

**Response envelope format:**
```json
{
    "success": true,
    "message": "Product created",
    "data": { ... }
}
```

## Use Case Instantiation

Use cases are instantiated fresh in **every route handler**. Do NOT reuse instances across requests:

```typescript
// ✅ CORRECT — new instance per request
app.post('/', async (request, reply) => {
    const useCase = new CreateProductUseCase();
    const result = await useCase.execute(request.body);
    return ApiResponse.success(reply, result, "Created", 201);
});

// ❌ WRONG — shared instance (state leaks between requests)
const useCase = new CreateProductUseCase();
app.post('/', async (request, reply) => {
    const result = await useCase.execute(request.body);
});
```

## Route Registration

After creating the routes file, register it in `src/routes.ts`:

```typescript
import { productRoutes } from "./modules/products/infrastructure/http/productRoutes";

export async function routes(app: FastifyInstance) {
    app.register(productRoutes, { prefix: '/products' });
}
```

The global prefix `/api/v1` is applied in `server.ts`, so routes are accessible at: `/api/v1/products/...`

## Sub-resource Routes

For resources nested under a parent (e.g., company locations):

```typescript
// GET /companies/:companyId/locations
app.get('/:companyId/locations', async (request, reply) => { ... });

// POST /companies/:companyId/locations
app.post('/:companyId/locations', { preHandler: [authMiddleware] } as any, async (request, reply) => { ... });

// PATCH /companies/locations/:id (operate on the sub-resource directly)
app.patch('/locations/:id', { preHandler: [authMiddleware] } as any, async (request, reply) => { ... });
```

## Error Handling

Routes do NOT need try/catch blocks. The global `errorHandler` in `server.ts` automatically:
- Catches `ApplicationError` subclasses and returns the correct HTTP status code.
- Catches `ValidationError` and returns a `400` with the validation messages.
- Catches all other errors and returns a generic `500 Internal Server Error`.
