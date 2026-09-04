# Sentry Error Tracking Plan (BackendApp)

## 1) Goal

Implement Sentry in this backend to capture unhandled errors, important handled exceptions, and execution context with minimal code changes and environment-driven setup.

## 2) MVP Scope

- Add Sentry SDK initialization at server bootstrap.
- Capture unexpected errors from global Fastify error handler.
- Attach request context (route, method, user id/company id when available).
- Keep business behavior unchanged (API responses stay the same).

Out of scope for MVP:

- frontend Sentry integration
- performance tracing tuning
- advanced sampling by endpoint

## 3) Architecture Fit (`.rules`)

Use shared cross-cutting layer (`src/shared`) for Sentry plumbing:

- `src/shared/infrastructure/observability/sentry.ts`
  - initialize SDK (`Sentry.init`)
  - expose helper methods (`captureException`, `captureMessage`, `setUserContext`)
- integrate in `src/server.ts` during app startup
- integrate in `src/shared/infrastructure/http/errorHandler.ts` for centralized capture

This keeps domain/application layers clean and avoids provider coupling in modules.

## 4) Environment Variables

- `SENTRY_ENABLED=true|false` (default `false`)
- `SENTRY_DSN` (required if enabled)
- `SENTRY_ENVIRONMENT` (`development`, `staging`, `production`)
- `SENTRY_RELEASE` (optional commit/tag)
- `SENTRY_TRACES_SAMPLE_RATE` (optional, default `0`)

Rules:

- if `SENTRY_ENABLED=false`, no-op integration
- if `SENTRY_ENABLED=true` and `SENTRY_DSN` missing, fail fast on startup with clear error

## 5) Implementation Steps

1. Install dependency
- `@sentry/node`

2. Create shared Sentry adapter
- initialize based on env
- expose safe no-op helpers when disabled

3. Bootstrap in server startup
- call `initSentry()` before route registration/listen
- include environment and release metadata

4. Capture errors in global error handler
- capture unknown/unexpected 5xx errors
- optionally capture selected 4xx custom errors that indicate abuse/security signals

5. Add request/user context enrichment
- set tags: route, method, statusCode
- set user: `request.user.userId` when authenticated
- set extra: request id, company id, module/use case hints if available

6. Keep response contract unchanged
- preserve existing error payload and status behavior
- Sentry is observability only, not response shaping

7. Validate
- `npm run build`
- force one test exception endpoint/use case locally
- confirm event appears in Sentry project with tags and user context

## 6) Error Policy

- Capture all unhandled exceptions (required).
- Do not capture common validation noise by default (`ValidationError`) unless debugging mode is enabled.
- Use warning/message capture for non-fatal anomalies where needed.

## 7) Security and PII

- Never send secrets (tokens, passwords, SMTP credentials).
- Scrub sensitive fields in request body/headers before capture.
- Keep breadcrumb/data payload minimal and useful.

## 8) Rollout

1. Deploy with `SENTRY_ENABLED=false` to verify startup safety.
2. Enable in staging with low/no tracing sample rate.
3. Validate alert volume and event quality.
4. Enable in production.

## 9) Deliverables Checklist

- [ ] Shared Sentry adapter in `src/shared/infrastructure/observability`
- [ ] `server.ts` initialization wiring
- [ ] `errorHandler.ts` capture integration
- [ ] Env variable documentation in `.env` templates
- [ ] Build success and manual exception verification

