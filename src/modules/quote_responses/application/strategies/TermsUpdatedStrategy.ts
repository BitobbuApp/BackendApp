import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';

/**
 * TermsUpdatedStrategy
 * Either party adjusts delivery/notes/conditions during negotiation.
 * Status transitions to `negotiating`.
 */
export class TermsUpdatedStrategy implements QuoteRevisionStrategy {
    readonly action = 'terms_updated';
    readonly allowedActors = ['buyer' as const, 'supplier' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId, payload } = params;

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new Error('QuoteResponse not found');

        assertTransition(existing.status as string, ResponseStatus.Negotiating);

        const updateData: Partial<QuoteResponse> = {
            status: ResponseStatus.Negotiating,
        };

        // Allow updating any combination of negotiable terms
        if (payload?.delivery_time !== undefined) updateData.delivery_time = payload.delivery_time;
        if (payload?.notes !== undefined) updateData.notes = payload.notes;
        if (payload?.payment_condition_id !== undefined) updateData.payment_condition_id = payload.payment_condition_id;
        if (payload?.delivery_method_id !== undefined) updateData.delivery_method_id = payload.delivery_method_id;
        if (payload?.has_guarantee !== undefined) updateData.has_guarantee = payload.has_guarantee;

        return this.repo.updateWithRevision(
            quoteResponseId,
            updateData,
            {
                action: this.action,
                actorCompanyId,
                snapshot: { changed_fields: Object.keys(payload || {}) },
            }
        );
    }
}
