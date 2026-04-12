import { ResponseStatus } from './entities/quote_response.entity';

/**
 * QuoteResponse State Machine
 *
 * Single source of truth for valid status transitions.
 * Pure domain logic — no I/O, no Prisma.
 */
const TRANSITIONS: Record<string, Set<string>> = {
    [ResponseStatus.Pending]: new Set([
        ResponseStatus.Negotiating,
        ResponseStatus.FormalRequestPending,
        // ResponseStatus.Accepted, // this step will be for path B for the MPV will not be implemented
        ResponseStatus.Rejected,
        ResponseStatus.Expired,
    ]),
    [ResponseStatus.Negotiating]: new Set([
        ResponseStatus.Negotiating,           // self-transition (price/qty/terms updates)
        ResponseStatus.FormalRequestPending,
        ResponseStatus.Rejected,
        ResponseStatus.Expired,
    ]),
    [ResponseStatus.FormalRequestPending]: new Set([
        ResponseStatus.FormalApprovalPending,
        ResponseStatus.Rejected,
        ResponseStatus.Expired,
    ]),
    [ResponseStatus.FormalApprovalPending]: new Set([
        ResponseStatus.Accepted,
        ResponseStatus.Negotiating,           // buyer rejects the PDF → back to negotiation
        ResponseStatus.Rejected,
        ResponseStatus.Expired,
    ]),
};

/**
 * Check if a transition from `from` to `to` is allowed.
 */
export function canTransition(from: string, to: string): boolean {
    const allowed = TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.has(to);
}

/**
 * Assert that a transition is allowed. Throws InvalidTransitionError if not.
 */
export function assertTransition(from: string, to: string): void {
    if (!canTransition(from, to)) {
        const { InvalidTransitionError } = require('./errors/InvalidTransitionError');
        throw new InvalidTransitionError(from, to);
    }
}
