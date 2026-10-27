# Repository Code Reduction Plan (Readability + Less Spreading)

## 1) Objective

Reduce repetitive and hard-to-read repository code (especially large conditional spreading blocks) without breaking current architecture or Prisma field-mapping rules.

## 2) Current Pain Points

- repeated `...(x !== undefined && { field: x })` patterns in many update/create methods
- large inline `data` objects mix business intent with plumbing
- duplicated relation connect/disconnect snippets
- lower readability and higher maintenance cost

## 3) Design Principles

- keep logic explicit enough to read quickly
- avoid "magic" abstractions that hide Prisma field names
- centralize only repeated mechanics (defined filtering, relation helpers, default helpers)
- keep `mapToEntity()` per repository (do not over-genericize domain mapping)

## 4) Proposed Approach

Create small shared Prisma data helpers for infrastructure only:

- `src/shared/infrastructure/database/prismaDataHelpers.ts`
  - `pickDefined<T>(obj: T): Partial<T>`
  - `withDefault<T>(value: T | undefined, fallback: T): T`
  - relation helpers:
    - `connectIfPresent(id)`
    - `connectOrDisconnect(idOrNullOrUndefined)`

Repository usage pattern:

- build typed `rawData` object in one readable block
- run through `pickDefined(...)` once
- keep special-case relations explicit with helper calls

## 5) Example Refactor Pattern

Before:

- many inline spreads per field in each method

After:

1. define `const rawData = { ... }` with nullable/optional intent
2. `const data = pickDefined(rawData)`
3. merge relation helpers clearly
4. pass `data` to Prisma call

Result:

- fewer lines
- clearer intent
- less copy/paste

## 6) Rollout Strategy

1. Baseline audit
- locate highest-noise repositories (line count + repeated spread patterns)
- prioritize modules with frequent updates (transactions, quote_responses, companies)

2. Pilot
- refactor 2 repositories first using new helpers
- confirm no behavior drift

3. Expand
- apply pattern module-by-module in small batches
- avoid large all-at-once refactor

4. Standardize
- document preferred repository style in `.rules/persistence.md`
- add PR checklist item:
  - "Prefer shared data helpers over repeated conditional spread blocks"

## 7) Guardrails

- do not hide Prisma model field names
- do not move business rules into helper utilities
- keep domain error mapping in repositories (e.g., Prisma error code handling)
- keep update behavior exact (`undefined` ignored, `null` preserved when intentional)

## 8) Verification

- `npm run build`
- targeted manual checks on refactored create/update flows
- confirm null/undefined semantics are unchanged

## 9) Deliverables

- [ ] shared `prismaDataHelpers.ts` with minimal helper set
- [ ] pilot refactor in 2 repositories
- [ ] pattern documentation update in `.rules/persistence.md`
- [ ] incremental rollout checklist for remaining repositories
- [ ] build + manual behavior parity verification

