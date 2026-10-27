import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { NegotiationStartedStrategy } from '../../../../src/modules/quote_responses/application/strategies/NegotiationStartedStrategy';
import { UnauthorizedActorError, InvalidTransitionError } from '../../../../src/modules/quote_responses/domain/errors/quote_response.errors';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const THIRD = '44444444-4444-4444-8444-444444444444';

interface Scenario {
    targetCompanyId: string | null;
    status?: string;
    existingConversation?: boolean;
}

/** Fakes the quote lookups (assertActorRole + strategy) and the DB transaction. */
function setup({ targetCompanyId, status = 'pending', existingConversation = false }: Scenario) {
    const quote = {
        id: QUOTE_ID,
        request_id: REQUEST_ID,
        supplier_id: SUPPLIER,
        company_offer_id: null,
        unit_price_usd: 10,
        quantity: 5,
        total_amount_usd: 50,
        status,
        request: { company_id: BUYER, target_company_id: targetCompanyId },
    };
    stub(prisma.quoteResponse, 'findUniqueOrThrow', async () => quote);

    const update = recorder(async ({ data }: any) => ({ ...quote, ...data }));
    const revision = recorder(async () => ({}));
    const createConversation = recorder(async ({ data }: any) => ({ id: 'conv', ...data }));
    const tx = {
        quoteResponse: { findUniqueOrThrow: async () => quote, update },
        quoteResponseRevision: { create: revision },
        conversation: {
            findFirst: async () => (existingConversation ? { id: 'existing' } : null),
            create: createConversation,
        },
    };
    stub(prisma, '$transaction', async (fn: any) => fn(tx));

    return { update, revision, createConversation };
}

const run = (actorCompanyId: string) =>
    new NegotiationStartedStrategy().execute({ quoteResponseId: QUOTE_ID, actorCompanyId, payload: {} } as any);

afterEach(restoreAll);

describe('NegotiationStartedStrategy — buyer (regression)', () => {
    test('buyer opens the negotiation on an open RFQ', async () => {
        const { update, revision, createConversation } = setup({ targetCompanyId: null });
        const result = await run(BUYER);

        assert.equal(result.status, 'negotiating');
        assert.equal(update.calls[0][0].data.status, 'negotiating');
        assert.equal(revision.calls[0][0].data.action, 'negotiation_started');
        assert.deepEqual(createConversation.calls[0][0].data, {
            participant_1_id: BUYER,
            participant_2_id: SUPPLIER,
            request_id: REQUEST_ID,
            quote_response_id: QUOTE_ID,
        });
    });

    test('does not duplicate an existing conversation', async () => {
        const { createConversation } = setup({ targetCompanyId: null, status: 'negotiating', existingConversation: true });
        await run(BUYER);
        assert.equal(createConversation.calls.length, 0);
    });

    test('respects the state machine', async () => {
        const { update } = setup({ targetCompanyId: null, status: 'accepted' });
        await assert.rejects(run(BUYER), InvalidTransitionError);
        assert.equal(update.calls.length, 0);
    });
});

describe('NegotiationStartedStrategy — supplier', () => {
    test('supplier cannot open the negotiation on an open RFQ', async () => {
        const { update, createConversation } = setup({ targetCompanyId: null });
        await assert.rejects(run(SUPPLIER), UnauthorizedActorError);
        assert.equal(update.calls.length, 0);
        assert.equal(createConversation.calls.length, 0);
    });

    test('target supplier opens the negotiation on its direct RFQ', async () => {
        const { createConversation } = setup({ targetCompanyId: SUPPLIER });
        const result = await run(SUPPLIER);

        assert.equal(result.status, 'negotiating');
        assert.equal(createConversation.calls[0][0].data.participant_1_id, BUYER);
        assert.equal(createConversation.calls[0][0].data.participant_2_id, SUPPLIER);
    });

    test('a company outside the quote cannot open the negotiation', async () => {
        const { update } = setup({ targetCompanyId: SUPPLIER });
        await assert.rejects(run(THIRD), UnauthorizedActorError);
        assert.equal(update.calls.length, 0);
    });
});
