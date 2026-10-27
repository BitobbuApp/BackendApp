import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { prisma } from '../../../../shared/infrastructure/database';

export const SUPPLIER_WITHDRAWN_REASON = 'Oferta retirada por el proveedor';

/**
 * CanceledStrategy
 * Supplier cancels/withdraws the quote.
 *
 * This strategy, in a single atomic transaction:
 * 1. Transitions QuoteResponse status to `rejected` (with the supplier's reason)
 * 2. Records the revision snapshot
 * 3. Closes the negotiation conversation (read-only history), if there is one
 */
export class CanceledStrategy implements QuoteRevisionStrategy {
    readonly action = 'canceled';
    readonly allowedActors = ['supplier' as const];

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId, payload } = params;

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const reason = typeof payload?.reason === 'string' && payload.reason.trim()
            ? payload.reason.trim().slice(0, 500)
            : SUPPLIER_WITHDRAWN_REASON;

        return prisma.$transaction(async (tx) => {
            const quoteResponse = await tx.quoteResponse.findUniqueOrThrow({
                where: { id: quoteResponseId }
            });

            assertTransition(quoteResponse.status, ResponseStatus.Rejected);

            const updated = await tx.quoteResponse.update({
                where: { id: quoteResponseId },
                data: { status: ResponseStatus.Rejected, rejection_reason: reason },
            });

            await tx.quoteResponseRevision.create({
                data: {
                    quote_response_id: quoteResponseId,
                    actor_company_id: actorCompanyId,
                    action: 'canceled',
                    snapshot: { status: ResponseStatus.Rejected, reason },
                },
            });

            // The chat stays only as read-only history
            await tx.conversation.updateMany({
                where: { quote_response_id: quoteResponseId },
                data: { status: 'cancelled' },
            });

            return new QuoteResponse(
                updated.id,
                updated.request_id,
                updated.supplier_id,
                updated.company_offer_id,
                Number(updated.unit_price_usd),
                Number(updated.quantity),
                updated.payment_conditions,
                updated.payment_condition_id,
                updated.delivery_method_id,
                updated.delivery_time,
                updated.estimated_delivery_hours,
                updated.notes,
                updated.has_guarantee,
                updated.status,
                updated.rejection_reason,
                Number(updated.total_amount_usd),
                updated.exchange_rate_id,
                updated.payment_currency,
                updated.formal_quote_url,
                (updated as any).serial_number,
                updated.created_at,
                updated.updated_at,
            );
        });
    }
}
