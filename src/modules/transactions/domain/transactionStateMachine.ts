import { TransactionStatus } from './entities/transaction.entity';

/**
 * Transaction State Machine
 *
 * Single source of truth for valid Transaction status transitions.
 * Pure domain logic — no I/O, no Prisma.
 *
 * Flow from sequence diagram:
 * awaiting_payment → payment_review → preparing_order → in_transit → completed
 */
const TRANSITIONS: Record<string, Set<string>> = {
    [TransactionStatus.AwaitingPayment]: new Set([
        TransactionStatus.PaymentReview,
        TransactionStatus.Canceled,
    ]),
    [TransactionStatus.PaymentReview]: new Set([
        TransactionStatus.PreparingOrder,
        TransactionStatus.AwaitingPayment, // Supplier rejects payment proof
        TransactionStatus.Canceled,
        TransactionStatus.InDispute,
    ]),
    [TransactionStatus.PreparingOrder]: new Set([
        TransactionStatus.InTransit,
        TransactionStatus.Canceled,
        TransactionStatus.InDispute,
    ]),
    [TransactionStatus.InTransit]: new Set([
        TransactionStatus.Completed,
        TransactionStatus.InDispute,
    ]),
    [TransactionStatus.InDispute]: new Set([
        TransactionStatus.PreparingOrder, // Resolved in supplier's favor
        TransactionStatus.Canceled,       // Resolved → cancel
    ]),
};

export function canTransition(from: string, to: string): boolean {
    const allowed = TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.has(to);
}

export function assertTransition(from: string, to: string): void {
    if (!canTransition(from, to)) {
        const { InvalidTransitionError } = require('./errors/transaction.errors');
        throw new InvalidTransitionError(from, to);
    }
}
