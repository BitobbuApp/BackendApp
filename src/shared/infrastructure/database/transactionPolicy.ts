/**
 * Transaction Policy Guideline
 *
 * 1. Repositories own Prisma transactions ($transaction).
 *    - Application use cases should never call `prisma.$transaction` directly.
 *    - A repository method should wrap multi-step DB writes or read-then-write sequences in a transaction.
 *
 * 2. Cross-module boundaries use orchestration, not global transactions.
 *    - If multiple modules need to be updated (e.g., QuoteResponse and Transaction), the calling use case
 *      orchestrates the flow by calling each module's use case or repository in sequence.
 *    - Idempotency and compensation strategies (or logging for manual intervention as MVP) should be used
 *      to handle partial failures.
 *
 * 3. Keep transactions short.
 *    - Do not perform external API calls or non-database heavy operations inside a Prisma transaction.
 */
export const TRANSACTION_POLICY_DOC = true;
