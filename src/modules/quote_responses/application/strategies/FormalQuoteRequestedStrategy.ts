import { QuoteResponseNotFoundError } from "../../domain/errors/quote_response.errors";
import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';

/**
 * FormalQuoteRequestedStrategy
 * Buyer requests a formal PDF quote from the supplier.
 * Status transitions to `formal_request_pending`.
 */
export class FormalQuoteRequestedStrategy implements QuoteRevisionStrategy {
    readonly action = 'formal_quote_requested';
    readonly allowedActors = ['buyer' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId } = params;

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new QuoteResponseNotFoundError(quoteResponseId);

        assertTransition(existing.status as string, ResponseStatus.FormalRequestPending);

        return this.repo.updateWithRevision(
            quoteResponseId,
            { status: ResponseStatus.FormalRequestPending },
            {
                action: this.action,
                actorCompanyId,
                snapshot: {},
            }
        );
    }
}
