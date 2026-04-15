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

        const repo = new (require('../../infrastructure/persistence/PrismaQuoteResponseRepository').PrismaQuoteResponseRepository)();

        const quoteResponse = await prisma.quoteResponse.findUniqueOrThrow({
            where: { id: quoteResponseId }
        });
        assertTransition(quoteResponse.status, ResponseStatus.Negotiating);

        return repo.startNegotiation(
            quoteResponseId,
            actorCompanyId,
            actorContext.buyerCompanyId,
            actorContext.supplierCompanyId
        );
    }
}
