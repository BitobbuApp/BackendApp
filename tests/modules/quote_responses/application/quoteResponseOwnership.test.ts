import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { UpdateQuoteResponseUseCase } from '../../../../src/modules/quote_responses/application/updateQuoteResponseUseCase';
import { DeleteQuoteResponseUseCase } from '../../../../src/modules/quote_responses/application/deleteQuoteResponseUseCase';
import { GetQuoteResponseByIdUseCase } from '../../../../src/modules/quote_responses/application/getQuoteResponseByIdUseCase';
import { GetQuoteResponseWithSupplierUseCase } from '../../../../src/modules/quote_responses/application/getQuoteResponseWithSupplierUseCase';
import { ListQuoteResponsesByRequestIdUseCase } from '../../../../src/modules/quote_responses/application/listQuoteResponsesByRequestIdUseCase';
import { PerformQuoteActionUseCase } from '../../../../src/modules/quote_responses/application/performQuoteActionUseCase';
import { NegotiationStartedStrategy } from '../../../../src/modules/quote_responses/application/strategies/NegotiationStartedStrategy';
import { InvalidTransitionError, UnauthorizedActorError, QuoteResponseNotFoundError } from '../../../../src/modules/quote_responses/domain/errors/quote_response.errors';
import { RequestAccessDeniedError, RequestNotFoundError } from '../../../../src/modules/requests/domain/errors/request.errors';
import { ValidationError } from '../../../../src/shared/domain/error';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const THIRD = '44444444-4444-4444-8444-444444444444';
const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';

const buildQuote = (overrides: any = {}) => ({
    id: QUOTE_ID,
    request_id: REQUEST_ID,
    supplier_id: SUPPLIER,
    company_offer_id: null,
    unit_price_usd: 10,
    quantity: 5,
    total_amount_usd: 50,
    status: 'pending',
    has_guarantee: false,
    created_at: new Date(),
    ...overrides,
});

/** Fake repository + the lookup used by assertActorRole (quote → supplier & request buyer). */
function fakeRepo(quote: any = buildQuote()) {
    stub(prisma.quoteResponse, 'findUniqueOrThrow', async () => ({
        supplier_id: quote?.supplier_id,
        request: { company_id: BUYER },
    }));
    return {
        findById: async () => quote,
        findQuoteResponseAndSupplier: async () => quote,
        findByRequestId: async () => ({ items: [quote], total: 1, page: 1, limit: 10 }),
        update: recorder(async (_id: string, data: any) => ({ ...quote, ...data })),
        delete: recorder(async () => undefined),
    };
}

function withRepo<T>(useCase: T, repo: any): T {
    (useCase as any).quoteResponseRepository = repo;
    return useCase;
}

afterEach(restoreAll);

describe('PATCH /quote-responses/:id (UpdateQuoteResponseUseCase)', () => {
    const update = (repo: any, requester: string, body: any = { unit_price_usd: 12 }) =>
        withRepo(new UpdateQuoteResponseUseCase(), repo)
            .execute({ id: QUOTE_ID, requester_company_id: requester, ...body });

    test('the supplier can edit its own pending quote', async () => {
        const repo = fakeRepo();
        const result = await update(repo, SUPPLIER);
        assert.equal(result.unit_price_usd, 12);
        assert.equal(repo.update.calls[0][1].requester_company_id, undefined);
    });

    test('another supplier cannot edit the quote', async () => {
        const repo = fakeRepo();
        await assert.rejects(update(repo, THIRD), UnauthorizedActorError);
        assert.equal(repo.update.calls.length, 0);
    });

    test('the buyer cannot edit the supplier quote', async () => {
        const repo = fakeRepo();
        await assert.rejects(update(repo, BUYER), UnauthorizedActorError);
        assert.equal(repo.update.calls.length, 0);
    });

    test('a quote under negotiation can only change through the chat', async () => {
        const repo = fakeRepo(buildQuote({ status: 'negotiating' }));
        await assert.rejects(update(repo, SUPPLIER), InvalidTransitionError);
        assert.equal(repo.update.calls.length, 0);
    });

    test('status cannot be changed through PATCH', async () => {
        const repo = fakeRepo();
        await assert.rejects(update(repo, SUPPLIER, { status: 'accepted' }), ValidationError);
        await assert.rejects(update(repo, SUPPLIER, { rejection_reason: 'x' }), ValidationError);
        assert.equal(repo.update.calls.length, 0);
    });
});

describe('DELETE /quote-responses/:id (DeleteQuoteResponseUseCase)', () => {
    const remove = (repo: any, requester: string) =>
        withRepo(new DeleteQuoteResponseUseCase(), repo).execute({ id: QUOTE_ID, requester_company_id: requester });

    test('the supplier can delete its own pending quote', async () => {
        const repo = fakeRepo();
        await remove(repo, SUPPLIER);
        assert.deepEqual(repo.delete.calls[0], [QUOTE_ID]);
    });

    test('other companies cannot delete it', async () => {
        const repo = fakeRepo();
        await assert.rejects(remove(repo, BUYER), UnauthorizedActorError);
        await assert.rejects(remove(repo, THIRD), UnauthorizedActorError);
        assert.equal(repo.delete.calls.length, 0);
    });

    test('a quote under negotiation cannot be deleted', async () => {
        const repo = fakeRepo(buildQuote({ status: 'negotiating' }));
        await assert.rejects(remove(repo, SUPPLIER), InvalidTransitionError);
    });
});

describe('quote reads', () => {
    for (const [name, UseCase] of [
        ['GetQuoteResponseByIdUseCase', GetQuoteResponseByIdUseCase],
        ['GetQuoteResponseWithSupplierUseCase', GetQuoteResponseWithSupplierUseCase],
    ] as const) {
        test(`${name}: buyer and supplier can read, a third company cannot`, async () => {
            const repo = fakeRepo();
            const read = (requester: string) =>
                withRepo(new (UseCase as any)(), repo).execute({ id: QUOTE_ID, requester_company_id: requester });

            assert.equal((await read(BUYER)).id, QUOTE_ID);
            assert.equal((await read(SUPPLIER)).id, QUOTE_ID);
            await assert.rejects(read(THIRD), UnauthorizedActorError);
        });

        test(`${name}: unknown quote → 404`, async () => {
            const repo = fakeRepo(null);
            await assert.rejects(
                withRepo(new (UseCase as any)(), repo).execute({ id: QUOTE_ID, requester_company_id: BUYER }),
                QuoteResponseNotFoundError
            );
        });
    }

    test('ListQuoteResponsesByRequestId: only the request owner sees all its quotes', async () => {
        stub(prisma.request, 'findUnique', async () => ({ company_id: BUYER }));
        const list = (requester: string) =>
            withRepo(new ListQuoteResponsesByRequestIdUseCase(), fakeRepo())
                .execute({ request_id: REQUEST_ID, requester_company_id: requester });

        assert.equal((await list(BUYER)).total, 1);
        await assert.rejects(list(SUPPLIER), RequestAccessDeniedError);
        await assert.rejects(list(THIRD), RequestAccessDeniedError);
    });

    test('ListQuoteResponsesByRequestId: unknown request → 404', async () => {
        stub(prisma.request, 'findUnique', async () => null);
        await assert.rejects(
            withRepo(new ListQuoteResponsesByRequestIdUseCase(), fakeRepo())
                .execute({ request_id: REQUEST_ID, requester_company_id: BUYER }),
            RequestNotFoundError
        );
    });
});

describe('POST /quote-responses/:id/action (PerformQuoteActionUseCase)', () => {
    test('expired is not accepted over HTTP', async () => {
        await assert.rejects(
            new PerformQuoteActionUseCase().execute({ quoteResponseId: QUOTE_ID, action: 'expired', actorCompanyId: THIRD }),
            ValidationError
        );
    });

    test('returns the conversation id so the client can open the chat', async () => {
        stub(NegotiationStartedStrategy.prototype, 'execute', async () => buildQuote({ status: 'negotiating' }));
        stub(prisma.transaction, 'findUnique', async () => null);
        stub(prisma.conversation, 'findFirst', async () => ({ id: CONVERSATION_ID, status: 'active' }));
        stub(PerformQuoteActionUseCase.prototype as any, 'emitSocketEvent', async () => undefined);

        const result = await new PerformQuoteActionUseCase()
            .execute({ quoteResponseId: QUOTE_ID, action: 'negotiation_started', actorCompanyId: BUYER });
        assert.equal(result.conversation_id, CONVERSATION_ID);
        assert.equal(result.status, 'negotiating');
    });
});
