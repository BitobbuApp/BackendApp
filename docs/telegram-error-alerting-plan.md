# Telegram Error Alerting Plan (BackendApp)

## 1) Goal

Send Telegram alerts when relevant backend errors occur, with minimal noise and no impact on API availability.

## 2) MVP Scope

- Add Telegram notifier in shared infrastructure.
- Trigger alerts from centralized error flow (global error handler), not from each module.
- Send concise operational payload (environment, endpoint, error type, request id, timestamp).
- Use environment variables only for configuration.

Out of scope for MVP:

- alert aggregation windowing
- on-call escalation policies
- dashboard/ack workflows

## 3) Architecture Fit (`.rules`)

Place Telegram integration under shared infrastructure:

- `src/shared/application/services/errorNotifier.service.ts`
  - `ErrorNotifierService` interface (`notifyCriticalError(input)`)
- `src/shared/infrastructure/notifications/telegramErrorNotifierService.ts`
  - concrete Telegram Bot API adapter
- `src/shared/infrastructure/config/telegramConfig.ts`
  - env parsing/validation
- integrate in `src/shared/infrastructure/http/errorHandler.ts`
  - notify only for selected errors

This keeps domain/application modules provider-agnostic.

## 4) Environment Variables

- `TELEGRAM_ALERTS_ENABLED=true|false` (default `false`)
- `TELEGRAM_BOT_TOKEN` (required if enabled)
- `TELEGRAM_CHAT_ID` (required if enabled)
- `TELEGRAM_ALERT_MIN_LEVEL` (`error` | `critical`, default `error`)
- `TELEGRAM_ALERT_ENVIRONMENTS` (comma-separated, e.g. `staging,production`)

Rules:

- if disabled, notifier is no-op
- if enabled and required vars missing, fail fast at startup

## 5) Alerting Strategy

Default MVP policy:

- alert on unhandled 5xx errors
- skip validation/business 4xx errors by default
- include dedupe fingerprint text (`error.name + route + minute bucket`) to reduce flood risk

Message format (concise):

- app/environment
- severity
- route + method
- error name + message
- request id
- user/company id when available
- ISO timestamp

## 6) Implementation Steps

1. Choose Telegram delivery method
- call Telegram Bot API directly via HTTPS (`sendMessage`)
- avoid adding heavy dependencies unless needed

2. Create notifier interface + adapter
- interface in `shared/application/services`
- Telegram implementation in `shared/infrastructure/notifications`
- include timeout and safe error handling

3. Configure + bootstrap
- parse env in `telegramConfig.ts`
- instantiate notifier in error handling composition point

4. Integrate with global error handler
- for eligible errors, send async alert (fire-and-forget with bounded timeout)
- never block or alter API response if Telegram fails

5. Noise control
- basic in-memory dedupe window (optional MVP enhancement)
- skip duplicate alerts for same fingerprint in short period (e.g., 60s)

6. Validate
- `npm run build`
- trigger synthetic 500 error in dev/staging
- verify Telegram message content and volume

## 7) Reliability and Safety

- Telegram failures are logged only; they do not break request flow.
- Truncate long stack traces/messages to stay within Telegram limits.
- Redact sensitive fields before sending.

## 8) Relationship with Sentry

Recommended combined approach:

- Sentry = full forensic trace and searchable events
- Telegram = fast operational signal for human attention

Implementation order:

1. integrate Sentry first
2. integrate Telegram second, using same centralized error classification logic

## 9) Rollout

1. Deploy with `TELEGRAM_ALERTS_ENABLED=false`.
2. Enable in staging for selected environments.
3. Tune filters/dedupe.
4. Enable production alerts.

## 10) Deliverables Checklist

- [ ] Error notifier interface in `shared/application`
- [ ] Telegram notifier adapter in `shared/infrastructure/notifications`
- [ ] Telegram env config parser
- [ ] Error-handler integration with filtering
- [ ] Alert payload redaction/truncation rules
- [ ] Build success + synthetic error validation

