# Prisma Transaction Boundary Plan (Repository-Centered)

## 1) Objective

Adopt a transaction strategy where Prisma transactions are owned by repositories (infrastructure), not embedded directly in use cases, while preserving current `.rules` (use-case orchestration, no cross-module repository imports).

## 2) Core Decision

- Use cases orchestrate business flow and call other module use cases.
- Repositories encapsulate atomic DB read/write sequences with `prisma.$transaction(...)`.
- Cross-module flows do not share direct repository access; they coordinate through use cases.

Example target flow:

- Quote response action use case calls a dedicated transaction use case (e.g., `CreateTransactionFromQuoteResponseUseCase`).
- The transaction module repository performs its own atomic persistence transaction internally.

## 3) Scope

In scope:

- define transaction boundary rules
- refactor selected repositories to own transaction blocks
- align inter-module orchestration pattern for quote_response -> transaction flow

Out of scope (MVP):

- global distributed transactions across modules
- introducing DI container or architectural rewrite

## 4) Transaction Policy

1. Repository-level transaction required when a method has read-then-write race risk or multi-write invariants in one aggregate/module.
2. Use case-level `prisma.$transaction` usage should be removed/forbidden (except temporary migration window).
3. Cross-module consistency handled by orchestration + idempotency/compensation, not shared transaction object across modules.
4. Keep failure semantics explicit:
- if downstream use case fails, decide between retry/compensation based on business rule.

## 5) Proposed Structure

- `src/modules/{module}/infrastructure/persistence/Prisma{Entity}Repository.ts`
  - methods wrap internal atomic logic in `prisma.$transaction` when needed
- `src/modules/{module}/application/*UseCase.ts`
  - orchestration only, no raw Prisma transaction blocks
- optional helper:
  - `src/shared/infrastructure/database/transactionPolicy.ts`
  - lightweight docs/helpers, no framework-level unit-of-work abstraction

## 6) Quote Response -> Transaction Plan

1. Keep quote response decision logic in quote_response use case.
2. When conditions are met, call `CreateTransactionFromQuoteResponseUseCase`.
3. Inside transaction module repository, execute all transaction-row invariants atomically.
4. Return explicit domain result to caller use case.
5. If orchestration step after creation fails, apply compensation policy (if needed) in dedicated use case logic.

## 7) Rollout Steps

1. Audit
- find all `prisma.$transaction` usages (`rg "\$transaction\(" src`)
- classify each as repository-level vs use-case-level

2. Refactor pass 1 (high risk paths)
- move use-case transaction blocks into corresponding repository methods
- keep method contracts explicit (`createFromQuoteResponse`, etc.)

3. Refactor pass 2 (remaining paths)
- standardize naming and error handling
- preserve domain error mapping (`P2002`, not found, conflicts)

4. Enforce
- add guideline in docs and code review checklist:
  - "No Prisma transaction blocks in application use cases"

5. Verify
- `npm run build`
- targeted manual tests for quote_response -> transaction creation flow
- regression check for race-sensitive updates

## 8) Risks and Mitigations

- Risk: cross-module partial failures.
- Mitigation: idempotent use cases + compensation/retry strategy for critical flows.

- Risk: hidden behavior changes during refactor.
- Mitigation: migrate flow-by-flow with small PRs and targeted checks.

## 9) Deliverables

- [ ] transaction boundary guideline documented
- [ ] use-case-level transaction calls removed for targeted modules
- [ ] repository atomic methods introduced for critical flows
- [ ] quote_response -> transaction orchestration updated via use-case import
- [ ] build + manual critical-path verification completed

