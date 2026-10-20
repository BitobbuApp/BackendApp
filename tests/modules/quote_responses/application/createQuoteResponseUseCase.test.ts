import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { CreateQuoteResponseUseCase } from '../../../../src/modules/quote_responses/application/createQuoteResponseUseCase';
import { PerformQuoteActionUseCase } from '../../../../src/modules/quote_responses/application/performQuoteActionUseCase';
import { UnauthorizedActorError } from '../../../../src/modules/quote_responses/domain/errors/quote_response.errors';
import { RequestNotFoundError } from '../../../../src/modules/requests/domain/errors/request.errors';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const OTHER_SELLER = '44444444-4444-4444-8444-444444444444';
const OFFER_ID = '55555555-5555-4555-8555-555555555555';
const CLIENT_OFFER_ID = '66666666-6666-4666-8666-666666666666';
const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';

const input = (overrides: any = {}) => ({
    request_id: REQUEST_ID,
    supplier_id: SUPPLIER,
    unit_price_usd: 12.5,
    quantity: 10,
    ...overrides,
});

/** Builds the use case with a fake repository that echoes what it receives. */
function setup(request: { target_company_id: string | null; company_offer_id: string | null } | null) {
    stub(prisma.request, 'findUnique', async () => request);
    stub(prisma.conversation, 'findFirst', async () => ({ id: CONVERSATION_ID }));
    const negotiate = recorder(async () => ({ status: 'negotiating' }));
    stub(PerformQuoteActionUseCase.prototype, 'execute', negotiate);

    const create = recorder(async (data: any) => ({
        ...data,
        id: QUOTE_ID,
        status: data.status ?? 'pending',
        total_amount_usd: data.unit_price_usd * data.quantity,
        created_at: new Date(),
    }));
    const useCase = new CreateQuoteResponseUseCase();
    (useCase as any).quoteResponseRepository = { create };
    return { useCase, create, negotiate };
}

afterEach(restoreAll);

describe('CreateQuoteResponseUseCase — open RFQ (regression)', () => {
    test('creates the quote without opening a negotiation', async () => {
        const { useCase, create, negotiate } = setup({ target_company_id: null, company_offer_id: null });
        const result = await useCase.execute(input({ company_offer_id: CLIENT_OFFER_ID }));

        assert.equal(create.calls.length, 1);
        assert.equal(create.calls[0][0].company_offer_id, CLIENT_OFFER_ID);
        assert.equal(negotiate.calls.length, 0);
        assert.equal(result.status, 'pending');
        assert.equal(result.conversation_id, null);
    });

    test('any seller can quote an open RFQ', async () => {
        const { useCase, create } = setup({ target_company_id: null, company_offer_id: null });
        await useCase.execute(input({ supplier_id: OTHER_SELLER }));
        assert.equal(create.calls.length, 1);
    });
});

describe('CreateQuoteResponseUseCase — direct RFQ', () => {
    test('target supplier quote is tied to the offer and opens the negotiation', async () => {
        const { useCase, create, negotiate } = setup({ target_company_id: SUPPLIER, company_offer_id: OFFER_ID });
        const result = await useCase.execute(input({ company_offer_id: CLIENT_OFFER_ID, status: 'negotiating' }));

        const created = create.calls[0][0];
        assert.equal(created.company_offer_id, OFFER_ID);
        assert.equal(created.status, 'pending');

        assert.equal(negotiate.calls.length, 1);
        assert.deepEqual(negotiate.calls[0][0], {
            quoteResponseId: QUOTE_ID,
            action: 'negotiation_started',
            actorCompanyId: SUPPLIER,
        });
        assert.equal(result.status, 'negotiating');
        assert.equal(result.conversation_id, CONVERSATION_ID);
    });

    test('another seller cannot quote a direct RFQ', async () => {
        const { useCase, create } = setup({ target_company_id: SUPPLIER, company_offer_id: OFFER_ID });
        await assert.rejects(useCase.execute(input({ supplier_id: OTHER_SELLER })), UnauthorizedActorError);
        assert.equal(create.calls.length, 0);
    });

    test('if opening the negotiation fails, the quote is still returned as pending', async () => {
        const { useCase, create } = setup({ target_company_id: SUPPLIER, company_offer_id: OFFER_ID });
        stub(PerformQuoteActionUseCase.prototype, 'execute', async () => { throw new Error('socket down'); });

        const result = await useCase.execute(input());
        assert.equal(create.calls.length, 1);
        assert.equal(result.status, 'pending');
        assert.equal(result.conversation_id, null);
    });
});

describe('CreateQuoteResponseUseCase — validation', () => {
    test('rejects quotes for a request that does not exist', async () => {
        const { useCase, create } = setup(null);
        await assert.rejects(useCase.execute(input()), RequestNotFoundError);
        assert.equal(create.calls.length, 0);
    });
});
