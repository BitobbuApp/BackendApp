import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { CanceledStrategy, SUPPLIER_WITHDRAWN_REASON } from '../../../../src/modules/quote_responses/application/strategies/CanceledStrategy';
import { UnauthorizedActorError, InvalidTransitionError } from '../../../../src/modules/quote_responses/domain/errors/quote_response.errors';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const THIRD = '44444444-4444-4444-8444-444444444444';

/** Fakes the actor lookup and the DB transaction (quote update, revision, conversation close). */
function setup(status = 'negotiating') {
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

const cancel = (actorCompanyId: string, payload: any = {}) =>
    new CanceledStrategy().execute({ quoteResponseId: QUOTE_ID, actorCompanyId, payload });

afterEach(restoreAll);

describe('CanceledStrategy (supplier withdraws the quote)', () => {
    test('supplier withdraws: quote rejected and the chat becomes read-only history', async () => {
        const { update, revision, closeConversation } = setup();
        const result = await cancel(SUPPLIER);

        assert.equal(result.status, 'rejected');
        assert.deepEqual(update.calls[0][0].data, { status: 'rejected', rejection_reason: SUPPLIER_WITHDRAWN_REASON });
        assert.equal(revision.calls[0][0].data.action, 'canceled');
        assert.deepEqual(closeConversation.calls[0][0], {
            where: { quote_response_id: QUOTE_ID },
            data: { status: 'cancelled' },
        });
    });

    test('keeps the supplier reason when given', async () => {
        const { update } = setup();
        await cancel(SUPPLIER, { reason: 'Sin stock' });
        assert.equal(update.calls[0][0].data.rejection_reason, 'Sin stock');
    });

    test('only the supplier can withdraw', async () => {
        const { update, closeConversation } = setup();
        await assert.rejects(cancel(BUYER), UnauthorizedActorError);
        await assert.rejects(cancel(THIRD), UnauthorizedActorError);
        assert.equal(update.calls.length, 0);
        assert.equal(closeConversation.calls.length, 0);
    });

    test('a quote that is already rejected cannot be withdrawn again', async () => {
        const { update } = setup('rejected');
        await assert.rejects(cancel(SUPPLIER), InvalidTransitionError);
        assert.equal(update.calls.length, 0);
    });
});
