import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';

/**
 * FormalQuoteAttachedStrategy
 * Supplier uploads and attaches a formal PDF quote.
 * Status transitions to `formal_approval_pending`.
 */
export class FormalQuoteAttachedStrategy implements QuoteRevisionStrategy {
    readonly action = 'formal_quote_attached';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId, payload } = params;

        if (!payload?.formal_quote_url) {
            throw new Error('formal_quote_url is required for this action.');
        }

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new Error('QuoteResponse not found');

        assertTransition(existing.status as string, ResponseStatus.FormalApprovalPending);

        return this.repo.updateWithRevision(
            quoteResponseId,
            {
                status: ResponseStatus.FormalApprovalPending,
                formal_quote_url: payload.formal_quote_url,
            },
            {
                action: this.action,
                actorCompanyId,
                snapshot: { formal_quote_url: payload.formal_quote_url },
            }
        );
    }
}
