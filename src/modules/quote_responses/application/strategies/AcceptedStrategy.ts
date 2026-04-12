import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { prisma } from '../../../../shared/infrastructure/database';

/**
 * AcceptedStrategy
 * Buyer accepts the quote response.
 * 
 * This strategy:
 * 1. Transitions QuoteResponse status to `accepted`
 * 2. Creates a `Transaction` record from the accepted quote data
 * 3. Links the existing Conversation (if any) to the new Transaction
 * 4. Records the revision snapshot
 * 
 * All steps are performed in a single atomic transaction.
 */
export class AcceptedStrategy implements QuoteRevisionStrategy {
    readonly action = 'accepted';
    readonly allowedActors = ['buyer' as const];

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId } = params;

        const actorContext = await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        return prisma.$transaction(async (tx) => {
            // 1. Load the full quote response with its parent request
            const quoteResponse = await tx.quoteResponse.findUniqueOrThrow({
                where: { id: quoteResponseId },
                include: {
                    request: { select: { id: true, product_service: true } },
                },
            });

            assertTransition(quoteResponse.status, ResponseStatus.Accepted);

            // 2. Update the QuoteResponse status to accepted
            const updated = await tx.quoteResponse.update({
                where: { id: quoteResponseId },
                data: { status: ResponseStatus.Accepted },
            });

            // 3. Create the revision snapshot
            await tx.quoteResponseRevision.create({
                data: {
                    quote_response_id: quoteResponseId,
                    actor_company_id: actorCompanyId,
                    action: 'accepted',
                    snapshot: {
                        unit_price_usd: Number(quoteResponse.unit_price_usd),
                        quantity: Number(quoteResponse.quantity),
                        total_amount_usd: Number(quoteResponse.total_amount_usd),
                        status: quoteResponse.status,
                    },
                },
            });

            // 4. Create the Transaction record
            const transaction = await tx.transaction.create({
                data: {
                    quote_response_id: quoteResponseId,
                    buyer_id: actorContext.buyerCompanyId,
                    supplier_id: actorContext.supplierCompanyId,
                    product_description: quoteResponse.request.product_service ?? 'N/A',
                    unit_price_usd: quoteResponse.unit_price_usd,
                    quantity: quoteResponse.quantity,
                    total_amount_usd: quoteResponse.total_amount_usd,
                    payment_conditions: quoteResponse.payment_conditions,
                    payment_condition_id: quoteResponse.payment_condition_id,
                    delivery_time: quoteResponse.delivery_time,
                    exchange_rate_id: quoteResponse.exchange_rate_id,
                    payment_currency: quoteResponse.payment_currency,
                    status: 'awaiting_payment',
                },
            });

            // 4.5. Initialize the first TransactionRevision
            await tx.transactionRevision.create({
                data: {
                    transaction_id: transaction.id,
                    actor_company_id: actorCompanyId,
                    action: 'transaction_created',
                    snapshot: {
                        unit_price_usd: Number(transaction.unit_price_usd),
                        quantity: Number(transaction.quantity),
                        total_amount_usd: Number(transaction.total_amount_usd),
                        payment_conditions: transaction.payment_conditions,
                        payment_condition_id: transaction.payment_condition_id,
                        delivery_time: transaction.delivery_time,
                        status: transaction.status,
                        payment_currency: transaction.payment_currency,
                    },
                },
            });

            // 5. Link existing conversation to the new transaction (if one exists)
            const existingConversation = await tx.conversation.findFirst({
                where: {
                    request_id: quoteResponse.request_id,
                    quote_response_id: quoteResponseId,
                },
            });

            if (existingConversation) {
                await tx.conversation.update({
                    where: { id: existingConversation.id },
                    data: { transaction_id: transaction.id },
                });
            }

            // 6. Mark the parent Request (RFQ) as completed
            await tx.request.update({
                where: { id: quoteResponse.request_id },
                data: { status: 'completed' as any },
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
            maxWait: 300000,
            timeout: 300000
        });
    }
}
