# Use Case Rules

## Base Class

Every use case extends `UseCase<TInput, TOutput>` from `shared/application/useCase.ts`.

This base class provides automatic:
1. **Input validation** via `inputSchema` (Joi)
2. **Business logic execution** via `implementation()`
3. **Output sanitization** via `outputSchema` (Joi with `stripUnknown`)

```typescript
export abstract class UseCase<TInput, TOutput> {
    protected abstract inputSchema: Joi.Schema;
    protected abstract outputSchema: Joi.Schema;
    protected abstract implementation(data: TInput): Promise<TOutput>;
    public async execute(data: any): Promise<TOutput>;  // entry point
}
```

## Mandatory Structure

Every use case must define:

1. **Input interface** — typed DTO for the input data
2. **Output interface** — typed DTO for the returned data (can be `any` for simple cases)
3. **`inputSchema`** — Joi schema for request validation
4. **`outputSchema`** — Joi schema for response sanitization
5. **Repository as private readonly** — instantiated in `constructor()`
6. **`implementation()`** — pure business logic

### Example (from `createCompanyUseCase.ts`):

```typescript
interface CreateCompanyInput {
    trade_name: string;
    legal_name?: string;
    tax_id?: string;
    creatorId: string;
}

interface CreateCompanyOutput {
    id: string;
    trade_name: string;
    created_at: Date;
}

export class CreateCompanyUseCase extends UseCase<CreateCompanyInput, CreateCompanyOutput> {
    protected inputSchema: Joi.Schema = createCompanyDtoRequestSchema;
    protected outputSchema: Joi.Schema = createCompanyDtoResponseSchema;
    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(data: CreateCompanyInput): Promise<CreateCompanyOutput> {
        // Business logic here
        const company = await this.companyRepository.create(data);
        return { id: company.id, trade_name: company.trade_name, created_at: company.created_at! };
    }
}
```

## Aggregator Use Cases

When a use case needs to combine data from **multiple modules** (like a global metadata endpoint), it should act as an **Aggregator**.

- **DO NOT** import multiple repositories.
- **DO** import and instantiate the relevant "List" or "Get" Use Cases from each module.
- **DO** use `Promise.all` if you want to execute sub-use cases in parallel for performance.
- **OR** use simple `await` if the calls are dependent on each other or if sequential execution is preferred for clarity.

### Example: Aggregator Pattern (Parallel)

```typescript
// Use Promise.all when data is independent and you want maximum speed
const [categories, paymentMethods] = await Promise.all([
    this.listCategoriesUseCase.execute({}),
    this.listPaymentMethodsUseCase.execute({}),
]);
```

### Example: Aggregator Pattern (Sequential)

```typescript
// Use simple await for clarity or if calls are dependent
const categories = await this.listCategoriesUseCase.execute({});
const paymentMethods = await this.listPaymentMethodsUseCase.execute({});
```

## Dependency Instantiation

- Use cases instantiate their own dependencies **inside the constructor**.
- Dependencies are **NOT injected** from the routing layer.
- Use the **repository interface** type (e.g., `CompanyRepository`), not the Prisma implementation.

```typescript
// ✅ CORRECT
private readonly companyRepository: CompanyRepository;  // interface type
constructor() {
    super();
    this.companyRepository = new PrismaCompanyRepository();  // concrete implementation
}

// ❌ WRONG — injecting from outside
constructor(repo: CompanyRepository) { ... }
```

## Cross-Module Dependencies

When a use case needs data from **another module**, import and instantiate the other module's use case:

```typescript
private readonly updateUserUseCase: UpdateUserUseCase;

constructor() {
    super();
    this.companyRepository = new PrismaCompanyRepository();
    this.updateUserUseCase = new UpdateUserUseCase();
}

protected async implementation(data: CreateCompanyInput) {
    const company = await this.companyRepository.create(data);
    await this.updateUserUseCase.execute({ id: data.creatorId, company_id: company.id });
    return company;
}
```

## Error Handling in Use Cases

- Throw **domain-specific errors** that extend `ApplicationError`.
- Do NOT catch errors just to re-throw generic ones.
- Let the global `errorHandler` in `server.ts` handle unexpected errors.

```typescript
// ✅ CORRECT — throw domain error directly
if (!existing) throw new CompanyNotFoundError(id);

// ✅ CORRECT — throw domain error for business rule violations
if (data.tax_id) {
    const existing = await this.companyRepository.findByTaxId(data.tax_id);
    if (existing) throw new CompanyAlreadyExistsError(data.tax_id);
}

// ❌ WRONG — catching and re-throwing generic errors
try {
    await this.repo.create(data);
} catch (e) {
    throw new Error("Something went wrong");
}
```

## DTO (Joi Schema) Rules

See `persistence.md` for Prisma-related patterns. For Joi DTOs:

- **Request schemas**: Validate all incoming fields. Use `.required()` for mandatory fields.
- **Response schemas**: Always use `.options({ stripUnknown: true })` to prevent leaking internal data.
- **Update schemas**: All fields are optional (except `id`). Use `.min(1)` on the object to require at least one field.
- **UUID fields**: Always validate with `Joi.string().uuid()`.
- **Nullable fields**: Use `.allow(null, '').optional()`.

```typescript
// Response schema — ALWAYS strip unknown
export const productDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
}).options({ stripUnknown: true });

// Update schema — at least 1 field required
export const updateProductDtoRequestSchema = Joi.object({
    name: Joi.string().max(200).optional(),
    price: Joi.number().min(0).optional(),
}).min(1);
```
