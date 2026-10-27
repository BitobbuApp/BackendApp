import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { RejectedStrategy } from '../../../../src/modules/quote_responses/application/strategies/RejectedStrategy';
import { getStrategy } from '../../../../src/modules/quote_responses/application/strategies/QuoteRevisionStrategyFactory';
import { UnauthorizedActorError, InvalidTransitionError } from '../../../../src/modules/quote_responses/domain/errors/quote_response.errors';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const THIRD = '44444444-4444-4444-8444-444444444444';

/** Fakes the actor lookup and the DB transaction (quote update, revision, conversation close). */
function setup(status = 'pending') {
    const quote = {
        id: QUOTE_ID, request_id: REQUEST_ID, supplier_id: SUPPLIER, company_offer_id: null,
        unit_price_usd: 10, quantity: 5, total_amount_usd: 50, status, rejection_reason: null,
        request: { company_id: BUYER, target_company_id: null },
    };
    stub(prisma.quoteResponse, 'findUniqueOrThrow', async () => quote);

    const update = recorder(async ({ data }: any) => ({ ...quote, ...data }));
    const revision = recorder(async () => ({}));
    const closeConversation = recorder(async () => ({ count: 1 }));
    const tx = {
        quoteResponse: { findUniqueOrThrow: async () => quote, update },
        quoteResponseRevision: { create: revision },
        conversation: { updateMany: closeConversation },
    };
    stub(prisma, '$transaction', async (fn: any) => fn(tx));
    return { update, revision, closeConversation };
}

const reject = (actorCompanyId: string, payload: any = {}) =>
    new RejectedStrategy().execute({ quoteResponseId: QUOTE_ID, actorCompanyId, payload });

afterEach(restoreAll);

describe('RejectedStrategy (buyer rejects the quote)', () => {
    test('is registered in the strategy factory', () => {
        assert.ok(getStrategy('rejected') instanceof RejectedStrategy);
    });

    test('buyer rejects a pending quote with a reason', async () => {
        const { update, revision, closeConversation } = setup('pending');
        const result = await reject(BUYER, { reason: '  Precio fuera de presupuesto  ' });

        assert.equal(result.status, 'rejected');
        assert.deepEqual(update.calls[0][0].data, { status: 'rejected', rejection_reason: 'Precio fuera de presupuesto' });
        assert.equal(revision.calls[0][0].data.action, 'rejected');
        assert.equal(revision.calls[0][0].data.actor_company_id, BUYER);
        // The chat (if any) becomes read-only
        assert.deepEqual(closeConversation.calls[0][0], {
            where: { quote_response_id: QUOTE_ID },
            data: { status: 'cancelled' },
        });
    });

    test('buyer can reject during the negotiation and without a reason', async () => {
        const { update } = setup('negotiating');
        await reject(BUYER);
        assert.equal(update.calls[0][0].data.rejection_reason, null);
    });

    test('the supplier cannot reject (it withdraws with "canceled")', async () => {
        const { update } = setup();
        await assert.rejects(reject(SUPPLIER), UnauthorizedActorError);
        assert.equal(update.calls.length, 0);
    });

    test('a company outside the quote cannot reject it', async () => {
        const { update } = setup();
        await assert.rejects(reject(THIRD), UnauthorizedActorError);
        assert.equal(update.calls.length, 0);
    });

    test('an accepted quote cannot be rejected', async () => {
        const { update, closeConversation } = setup('accepted');
        await assert.rejects(reject(BUYER), InvalidTransitionError);
        assert.equal(update.calls.length, 0);
        assert.equal(closeConversation.calls.length, 0);
    });
});
