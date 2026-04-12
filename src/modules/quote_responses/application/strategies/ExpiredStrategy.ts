import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';

/**
 * ExpiredStrategy
 * System automatically expires the quote (invoked by cronjob).
 * Status transitions to `expired`.
 * No actor role validation — system action.
 */
export class ExpiredStrategy implements QuoteRevisionStrategy {
    readonly action = 'expired';
    readonly allowedActors = ['system' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId } = params;

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new Error('QuoteResponse not found');

        assertTransition(existing.status as string, ResponseStatus.Expired);

        return this.repo.updateWithRevision(
            quoteResponseId,
            { status: ResponseStatus.Expired },
            {
                action: this.action,
                actorCompanyId,
                snapshot: { expired_by: 'system' },
            }
        );
    }
}
