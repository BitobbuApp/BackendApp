import { QuoteResponseNotFoundError } from "../../domain/errors/quote_response.errors";
import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';

/**
 * PriceUpdatedStrategy
 * Supplier adjusts the unit price during negotiation.
 * Status transitions to `negotiating`.
 */
export class PriceUpdatedStrategy implements QuoteRevisionStrategy {
    readonly action = 'price_updated';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId, payload } = params;

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new QuoteResponseNotFoundError(quoteResponseId);

        assertTransition(existing.status as string, ResponseStatus.Negotiating);

        return this.repo.updateWithRevision(
            quoteResponseId,
            {
                unit_price_usd: payload!.unit_price_usd,
                status: ResponseStatus.Negotiating,
            },
            {
                action: this.action,
                actorCompanyId,
                snapshot: { changed_field: 'unit_price_usd', new_value: payload!.unit_price_usd },
            }
        );
    }
}
