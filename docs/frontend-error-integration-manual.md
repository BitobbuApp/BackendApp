# Frontend Error Integration Manual

## Goal
Integrate backend error responses in a consistent way so users always see clear messages and the UI can react by `error.code` (not by free-text message).

## Canonical Error Response
Most endpoints return this structure on errors:

```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human-readable message",
    "category": "VALIDATION|AUTHENTICATION|AUTHORIZATION|NOT_FOUND|CONFLICT|BUSINESS|INFRASTRUCTURE|INTERNAL",
    "status": 400,
    "details": {},
    "traceId": "uuid-or-header-trace-id"
  },
  "message": "Legacy duplicate message"
}
```

Notes:
- `x-trace-id` request header is echoed back as `error.traceId` when present.
- Some legacy paths may include `details` or `errors` at top level.
- Frontend should always read from `error.*` first.

## Frontend Normalization (Required)
Use one parser so all screens consume the same shape:

```ts
type NormalizedApiError = {
  code: string;
  status: number;
  category: string;
  message: string;
  details: unknown;
  traceId?: string;
};

export function normalizeApiError(payload: any, httpStatus?: number): NormalizedApiError {
  const e = payload?.error ?? {};
  return {
    code: e.code ?? "INTERNAL_SERVER_ERROR",
    status: e.status ?? httpStatus ?? 500,
    category: e.category ?? "INTERNAL",
    message: e.message ?? payload?.message ?? "An unexpected error occurred",
    details: e.details ?? payload?.details ?? payload?.errors ?? {},
    traceId: e.traceId
  };
}
```

## Master Error Code Catalog

| Code | HTTP | Category | Backend Message Pattern | Frontend UX Message (Recommended) |
|---|---:|---|---|---|
| `VALIDATION_ERROR` | 400 | `VALIDATION` | `Validation Failed` or field validation text | `Please review the highlighted fields.` |
| `AUTH_MISSING_TOKEN` | 401 | `AUTHENTICATION` | `Authentication token missing...` | `Your session is missing. Please sign in again.` |
| `AUTH_INVALID_TOKEN` | 401 | `AUTHENTICATION` | `Invalid or expired token` | `Your session expired. Please sign in again.` |
| `USER_INVALID_CREDENTIALS` | 401 | `AUTHENTICATION` | `Invalid email or password` | `Email or password is incorrect.` |
| `USER_NOT_FOUND` | 404 | `NOT_FOUND` | `User {identifier} not found` | `We could not find that user.` |
| `USER_ALREADY_EXISTS` | 409 | `CONFLICT` | `User with email {email} already exists` | `An account with this email already exists.` |
| `COMPANY_NOT_FOUND` | 404 | `NOT_FOUND` | `Company with ID {id} not found` | `Company not found.` |
| `COMPANY_ALREADY_EXISTS` | 409 | `CONFLICT` | `Company with Tax ID {taxId} already exists` | `A company with this Tax ID already exists.` |
| `LOCATION_NOT_FOUND` | 404 | `NOT_FOUND` | `Location with ID {id} not found` | `Location not found.` |
| `CONTACT_NOT_FOUND` | 404 | `NOT_FOUND` | `Contact with ID {id} not found` | `Contact not found.` |
| `COMPANY_PRIMARY_CONTACT_DELETE_FORBIDDEN` | 409 | `CONFLICT` | `Cannot delete the primary contact...` | `Set another primary contact before deleting this one.` |
| `COMPANY_MAIN_HEADQUARTERS_DELETE_FORBIDDEN` | 409 | `CONFLICT` | `Cannot delete the main headquarters...` | `Set another main location before deleting this one.` |
| `REQUEST_NOT_FOUND` | 404 | `NOT_FOUND` | `Request with ID {id} not found` | `Request not found.` |
| `QUOTE_RESPONSE_NOT_FOUND` | 404 | `NOT_FOUND` | `Quote response with ID {id} not found` | `Quote response not found.` |
| `QUOTE_RESPONSE_DUPLICATE` | 409 | `CONFLICT` | `Quote response for request {id}... already exists` | `A quote response for this request already exists.` |
| `QUOTE_RESPONSE_INVALID_TRANSITION` | 409 | `CONFLICT` | Transition-related message | `This status change is not allowed.` |
| `QUOTE_RESPONSE_UNAUTHORIZED_ACTOR` | 403 | `AUTHORIZATION` | `Company role "{role}" is not authorized...` | `You do not have permission for this action.` |
| `TRANSACTION_NOT_FOUND` | 404 | `NOT_FOUND` | `Transaction with ID {id} not found` | `Transaction not found.` |
| `TRANSACTION_DUPLICATE` | 409 | `CONFLICT` | `Transaction for quote response ID "{id}" already exists` | `A transaction already exists for this quote response.` |
| `TRANSACTION_INVALID_TRANSITION` | 409 | `CONFLICT` | Transition-related message | `This status change is not allowed.` |
| `TRANSACTION_UNAUTHORIZED_ACTOR` | 403 | `AUTHORIZATION` | `Company role "{role}" is not authorized...` | `You do not have permission for this action.` |
| `REVIEW_NOT_FOUND` | 404 | `NOT_FOUND` | `Pending review not found` (or variant) | `Review not found.` |
| `REVIEW_UNAUTHORIZED_ACTOR` | 403 | `AUTHORIZATION` | `You are not the buyer/supplier...` | `You cannot submit this review.` |
| `REVIEW_ALREADY_SUBMITTED` | 400 | `BUSINESS` | `You have already submitted your review` | `You already submitted this review.` |
| `REVIEW_PERIOD_EXPIRED` | 400 | `BUSINESS` | `The review period has expired` | `Review period has expired.` |
| `BUSINESS_ERROR` | 4xx | `BUSINESS` | Legacy custom error with only `statusCode` | `This operation cannot be completed right now.` |
| `INTERNAL_SERVER_ERROR` | 500 (or legacy 4xx paths) | `INTERNAL` | `An unexpected error occurred` (or provided message) | `Something went wrong. Please try again.` |

## Known Legacy/Fallback Cases (Important)
These currently return 4xx but do **not** have specific business codes, so frontend receives `INTERNAL_SERVER_ERROR`:
- Conversation and message permission/not-found flows using `ConversationNotFoundError` / `ConversationAccessDeniedError`.
- Company offer not found (`CompanyOfferNotFoundError`).
- Onboarding status not found (`OnboardingStatusNotFoundError`).
- Some direct `ApiResponse.error(...)` calls without explicit code/category (for example, certain dashboard and transaction route checks).
- Unknown quote revision action (`ApplicationError(400, ...)` without explicit code/category).

Recommendation:
- Keep fallback UI by HTTP status and category for these cases.
- Log and monitor `INTERNAL_SERVER_ERROR` with 4xx status, since they represent unmapped domain errors.

## Frontend Handling Rules
1. Route behavior using `code` first.
2. If code is unknown, fallback to `(category, status)`.
3. Never branch UI logic on full `message` text.
4. Show user-friendly text in UI, keep backend `message` for logs/debug panel only.
5. Include `traceId` in error-report tooling and optional support modal.

## Suggested UX Matrix
| Condition | UX Action |
|---|---|
| `status = 401` | Clear auth state and redirect to login. |
| `status = 403` | Show permission message; keep user on current page. |
| `status = 404` | Show not-found empty state and back navigation option. |
| `status = 409` | Show conflict guidance and CTA to refresh/reload entity. |
| `status = 400` + `VALIDATION_ERROR` | Inline field errors + summary alert. |
| `status >= 500` | Generic error screen/toast + retry action. |

## QA Checklist
- Verify each auth scenario returns correct login/session UX.
- Verify all forms render `VALIDATION_ERROR.details`.
- Verify all `409` conflicts show actionable next step.
- Verify unknown code fallback still gives non-technical message.
- Verify support logs include `code`, `status`, `category`, and `traceId`.
