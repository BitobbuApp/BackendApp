import { InvalidTransitionError, UnauthorizedActorError } from "../../domain/errors/quote_response.errors";
import { ResponseStatus } from "../../domain/entities/quote_response.entity";

/**
 * Direct edits (PATCH/DELETE) of a quote are only allowed to its supplier while it is still pending.
 * Once the negotiation starts, every change must go through the state machine (/:id/action).
 */
export function assertSupplierCanEditQuote(
    quote: { supplier_id: string; status: string },
    requesterCompanyId: string
): void {
    if (quote.supplier_id !== requesterCompanyId) {
        throw new UnauthorizedActorError("Only the supplier who created the quote can modify it");
    }
    if (quote.status !== ResponseStatus.Pending) {
        throw new InvalidTransitionError("Una cotización en negociación solo se modifica desde el chat");
    }
}
