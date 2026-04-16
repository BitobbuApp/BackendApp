import { QuoteResponseNotFoundError } from "../../domain/errors/quote_response.errors";
import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';

/**
 * CanceledStrategy
 * Supplier cancels/withdraws the quote.
 * Status transitions to `rejected`.
 */
export class CanceledStrategy implements QuoteRevisionStrategy {
    readonly action = 'canceled';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId, payload } = params;

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new QuoteResponseNotFoundError(quoteResponseId);

        assertTransition(existing.status as string, ResponseStatus.Rejected);

        return this.repo.updateWithRevision(
            quoteResponseId,
            {
                status: ResponseStatus.Rejected,
                rejection_reason: payload?.reason ?? 'Canceled by supplier',
            },
            {
                action: this.action,
                actorCompanyId,
                snapshot: { reason: payload?.reason ?? 'Canceled by supplier' },
            }
        );
    }
}
