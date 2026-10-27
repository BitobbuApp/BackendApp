# Error Management Improvement Plan

## Goal
Improve backend error handling so clients receive consistent, actionable, and stable errors across all endpoints, with unique error codes for business logic and other predictable failures.

## Current State (Observed in Code)
- There is a global Fastify error handler in [src/shared/infrastructure/http/errorHandler.ts](/C:/projects/BackendApp/src/shared/infrastructure/http/errorHandler.ts).
- Custom business/domain errors usually extend `ApplicationError`, but many errors still use plain `Error` or ad-hoc `statusCode` properties.
- Error response shapes are inconsistent:
- `errorHandler` sends `{ error, message, details? }`.
- `ApiResponse.error` sends `{ success: false, message, errors }` in [src/shared/infrastructure/http/responseFormatter.ts](/C:/projects/BackendApp/src/shared/infrastructure/http/responseFormatter.ts).
- Some business rule failures throw generic `Error` (example: [removeContactUseCase.ts](/C:/projects/BackendApp/src/modules/companies/application/removeContactUseCase.ts), [removeLocationUseCase.ts](/C:/projects/BackendApp/src/modules/companies/application/removeLocationUseCase.ts)).
- Several business errors are represented as `ApplicationError(status, message)` without stable machine-readable code.

## Recommendation
Use a **single standardized error envelope** for every non-2xx response, and include a required `code` field.

Suggested response contract:

```json
{
  "success": false,
  "error": {
    "code": "COMPANY_PRIMARY_CONTACT_DELETE_FORBIDDEN",
    "message": "Cannot delete the primary contact. Assign another contact as primary first.",
    "category": "BUSINESS",
    "status": 409,
    "details": {},
    "traceId": "8f6f9e73-..."
  }
}
```

Why this is better than only returning unique codes for a few cases:
- Client apps can rely on one parsing strategy everywhere.
- Codes become stable API contracts, while messages can evolve.
- `traceId` enables support/debug without exposing internals.

## Error Taxonomy
Define categories and enforce them in shared error primitives.

- `VALIDATION` (400/422): Joi input/output contract failures.
- `AUTHENTICATION` (401): missing/invalid token.
- `AUTHORIZATION` (403): actor not allowed.
- `NOT_FOUND` (404): entity missing.
- `CONFLICT` (409): duplicate entities, invalid state transitions, protected deletions.
- `BUSINESS` (409/422): domain rules violated.
- `INFRASTRUCTURE` (502/503): DB/service dependencies unavailable.
- `INTERNAL` (500): unknown/unexpected failures.

## Code Strategy
Create a stable code naming convention and keep it documented.

Recommended format:
- `MODULE_REASON` (simple, readable), example:
- `USER_NOT_FOUND`
- `USER_INVALID_CREDENTIALS`
- `REQUEST_NOT_FOUND`
- `TRANSACTION_INVALID_TRANSITION`
- `COMPANY_PRIMARY_CONTACT_DELETE_FORBIDDEN`

Alternative format (if you prefer strict governance):
- `BITO-<module>-<number>` (example `BITO-COMP-0012`).
- Better for very large organizations, but less readable for frontend teams.

## Implementation Plan (Phased)

### Phase 1: Shared Foundations
1. Extend shared error base class in [src/shared/domain/error.ts](/C:/projects/BackendApp/src/shared/domain/error.ts):
   - Add `code`, `category`, `details`, `isOperational`.
2. Create centralized error catalog file (for example `src/shared/domain/error-codes.ts`).
3. Refactor global handler [src/shared/infrastructure/http/errorHandler.ts](/C:/projects/BackendApp/src/shared/infrastructure/http/errorHandler.ts) to always return the same envelope.
4. Generate/propagate a request `traceId` (from header or generated per request).

### Phase 2: Normalize Existing Business Errors
1. Replace plain `Error` throws in use cases with typed domain/business errors.
2. Convert current ad-hoc status-code errors (`UnauthorizedActorError`, `InvalidTransitionError`) to extend the shared base error class.
3. Replace direct `ApplicationError(404, "...")` usage in review use cases with explicit named errors and codes.

### Phase 3: HTTP Layer Consistency
1. Stop mixing `ApiResponse.error` and `errorHandler` formats; keep one error output shape.
2. Keep success responses unchanged if needed for backward compatibility, but unify all failures.
3. Update auth middleware to throw/return shared typed errors with proper `code`.

### Phase 4: Client Contract + Documentation
1. Add `ERRORS.md` (or OpenAPI section) with:
   - Code
   - HTTP status
   - Meaning
   - Client action recommendation
2. Add endpoint-level known error codes for critical flows (auth, requests, transactions, quote responses, companies).

### Phase 5: Observability and Quality Gates
1. Log errors with `code`, `category`, `traceId`, and sanitized context.
2. Add tests that assert:
   - Response shape consistency.
   - Correct code/status for key business rules.
   - No raw stack traces/messages leaked in production.

## Initial Code Set to Prioritize
- Companies:
- `COMPANY_NOT_FOUND`
- `COMPANY_ALREADY_EXISTS`
- `COMPANY_PRIMARY_CONTACT_DELETE_FORBIDDEN`
- `COMPANY_MAIN_HEADQUARTERS_DELETE_FORBIDDEN`
- Users:
- `USER_NOT_FOUND`
- `USER_ALREADY_EXISTS`
- `USER_INVALID_CREDENTIALS`
- Requests:
- `REQUEST_NOT_FOUND`
- Transactions:
- `TRANSACTION_NOT_FOUND`
- `TRANSACTION_DUPLICATE`
- `TRANSACTION_INVALID_TRANSITION`
- `TRANSACTION_UNAUTHORIZED_ACTOR`
- Quote responses:
- `QUOTE_RESPONSE_NOT_FOUND`
- `QUOTE_RESPONSE_DUPLICATE`
- `QUOTE_RESPONSE_INVALID_TRANSITION`
- `QUOTE_RESPONSE_UNAUTHORIZED_ACTOR`

## Backward Compatibility Strategy
- For one transition period, return both:
- legacy fields (`message`, etc.)
- new `error` object with `code`.
- Announce deprecation date for legacy fields.
- After frontend migration, remove legacy-only formats.

## Suggested Priority Order (Low Risk, High Value)
1. Shared error primitive + global handler envelope.
2. Companies and Users modules (high usage and clear errors).
3. Transactions and Quote Responses (state-machine/business-rule heavy).
4. Remaining modules.

## Acceptance Criteria
- Every non-2xx API response includes `error.code`.
- Same response structure across routes/middlewares/global handler.
- Top business rules return deterministic status + code.
- Logs contain `traceId` and error `code`.
- Documented error catalog is available to frontend/mobile clients.
