import { QuoteResponseNotFoundError } from "../../domain/errors/quote_response.errors";
import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { prisma } from '../../../../shared/infrastructure/database';

/**
 * NegotiationStartedStrategy
 * Buyer opens the chat to start negotiation.
 * 
 * This strategy:
 * 1. Transitions QuoteResponse status to `negotiating`
 * 2. Creates the `Conversation` connecting buyer and supplier for this quote
 * 3. Records the revision snapshot
 * 
 * All steps are performed in a single atomic transaction.
 */
export class NegotiationStartedStrategy implements QuoteRevisionStrategy {
    readonly action = 'negotiation_started';
    readonly allowedActors = ['buyer' as const];

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId } = params;

        const actorContext = await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        return prisma.$transaction(async (tx) => {
            // 1. Load the full quote response
            const quoteResponse = await tx.quoteResponse.findUniqueOrThrow({
                where: { id: quoteResponseId }
            });

            assertTransition(quoteResponse.status, ResponseStatus.Negotiating);

            // 2. Update the QuoteResponse status to negotiating
            const updated = await tx.quoteResponse.update({
                where: { id: quoteResponseId },
                data: { status: ResponseStatus.Negotiating },
            });

            // 3. Create the revision snapshot
            await tx.quoteResponseRevision.create({
                data: {
                    quote_response_id: quoteResponseId,
                    actor_company_id: actorCompanyId,
                    action: 'negotiation_started',
                    snapshot: {
                        status: ResponseStatus.Negotiating,
                    },
                },
            });

            // 4. Create the Conversation record specifically for this negotiation
            const existingConversation = await tx.conversation.findFirst({
                where: {
                    request_id: quoteResponse.request_id,
                    quote_response_id: quoteResponseId,
                },
            });

            if (!existingConversation) {
                await tx.conversation.create({
                    data: {
                        participant_1_id: actorContext.buyerCompanyId,
                        participant_2_id: actorContext.supplierCompanyId,
                        request_id: quoteResponse.request_id,
                        quote_response_id: quoteResponseId,
                    },
                });
            }

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
                updated.notes,
                updated.has_guarantee,
                updated.status,
                updated.rejection_reason,
                Number(updated.total_amount_usd),
                updated.exchange_rate_id,
                updated.payment_currency,
                updated.formal_quote_url,
                updated.created_at,
                updated.updated_at,
            );
        }, {
            maxWait: 300000, // 5 minutos esperando la conexión
            timeout: 300000  // 5 minutos manteniendo la transacción viva
        });
    }
}
