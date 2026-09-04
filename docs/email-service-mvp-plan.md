# Email Service MVP Plan (Nodemailer + Brevo)

## 1) Goal

Build an in-server email service for MVP that:

- works by only setting environment variables
- uses `nodemailer` for transport
- supports Brevo templates (transactional template IDs + params)
- is designed to be extracted later into a dedicated notification service

## 2) Scope for MVP

- Add a shared email service (no new public HTTP routes required for MVP).
- Trigger emails from existing use cases where needed (e.g., user/account events).
- Keep provider details in infrastructure layer only.
- Fail safely: email errors must be logged and must not break critical business flow unless explicitly required.

Out of scope for MVP:

- queueing/retry workers
- webhook event tracking
- multi-provider failover
- standalone notification microservice

## 3) Architecture (Aligned with `.rules`)

Use shared cross-cutting structure (`src/shared`) for email capability:

- `src/shared/domain/notifications/emailMessage.ts`
  - Domain contract for email payload (to, subject, template key, variables, metadata).
- `src/shared/application/services/email.service.ts`
  - `EmailService` interface (`sendTemplate`, `sendRaw` if needed).
- `src/shared/infrastructure/notifications/nodemailerBrevoEmailService.ts`
  - Nodemailer adapter configured for Brevo SMTP/API key.
- `src/shared/infrastructure/config/emailConfig.ts`
  - Reads/validates env vars once at startup.

Rule alignment:

- dependency flow remains inward: infrastructure -> application -> domain
- no cross-module repository imports
- use cases orchestrate sending by calling service abstraction (not provider SDK directly)

## 4) Environment Variables

Required for operation:

- `EMAIL_ENABLED=true|false` (default `false` for safe local/dev startup)
- `EMAIL_FROM_ADDRESS` (e.g., `no-reply@yourdomain.com`)
- `EMAIL_FROM_NAME` (e.g., `Bitobbu`)
- `EMAIL_BREVO_SMTP_HOST` (typically `smtp-relay.brevo.com`)
- `EMAIL_BREVO_SMTP_PORT` (usually `587`)
- `EMAIL_BREVO_SMTP_USER` (Brevo SMTP login)
- `EMAIL_BREVO_SMTP_PASS` (Brevo SMTP key/password)

Template mapping:

- `EMAIL_TEMPLATE_WELCOME`
- `EMAIL_TEMPLATE_PASSWORD_RESET`
- `EMAIL_TEMPLATE_VERIFICATION`

Notes:

- If `EMAIL_ENABLED=false`, service logs and no-ops.
- Missing required vars with `EMAIL_ENABLED=true` should fail fast at startup with clear error.

## 5) Template Strategy (Brevo)

- Application layer sends semantic template keys (example: `welcome`, `password_reset`).
- Infrastructure layer maps keys to Brevo template IDs from env.
- Template variables are passed as a flat object (`Record<string, string | number | boolean>`).
- Keep template ownership in Brevo dashboard; backend only sends IDs + params.

## 6) Implementation Steps

1. Install dependencies
- `nodemailer`
- `@types/nodemailer` (dev)

2. Create shared email contracts + service interface
- add domain payload/type definitions
- add application service interface

3. Create config loader
- centralize env parsing + validation for email settings
- expose typed config object

4. Implement Brevo/Nodemailer adapter
- create transporter
- implement `sendTemplate(...)`
- add structured logging (`messageId`, recipient, template key)

5. Wire into target use case(s)
- instantiate service in constructor (current project convention)
- call service after successful business operation
- keep business transaction safety (email send should not rollback domain success unless explicitly required)

6. Add docs and `.env` examples
- update `.env.prod` and local env template guidance
- include template variable contract examples

7. Verify
- `npm run build`
- targeted manual call from one use case in dev with `EMAIL_ENABLED=true`
- confirm no-op path when `EMAIL_ENABLED=false`

## 7) Error Handling and Reliability

- Log provider errors with context (use case, recipient, template key).
- Return domain success even if email fails (MVP default behavior).
- Keep code ready for future upgrade to async dispatch (queue/outbox) without changing use case API.

## 8) Future Extraction Path (Notification Service)

Design now to simplify migration later:

- Keep use cases dependent on `EmailService` contract only.
- Keep provider-specific payload mapping isolated in infrastructure adapter.
- When extracting:
  - replace current adapter with HTTP/event publisher adapter
  - keep same `EmailService` methods/signature in application layer
  - move template mapping/config to external service gradually

## 9) Deliverables Checklist

- [ ] Email service contract in `shared/application`
- [ ] Brevo Nodemailer adapter in `shared/infrastructure`
- [ ] Email env config parser + validation
- [ ] At least one real use case integration
- [ ] `.env` variable documentation
- [ ] Build passes (`npm run build`)

