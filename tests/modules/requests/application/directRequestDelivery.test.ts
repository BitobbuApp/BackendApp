import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { matchingQueue, notificationsQueue } from '../../../../src/shared/infrastructure/queue/index.queue';
import { CreateRequestUseCase } from '../../../../src/modules/requests/application/createRequestUseCase';
import { MatchRfqToSuppliersUseCase } from '../../../../src/modules/requests/application/matchRfqToSuppliersUseCase';
import { ListMarketplaceRequestsUseCase } from '../../../../src/modules/requests/application/listMarketplaceRequestsUseCase';
import { RequestEntity } from '../../../../src/modules/requests/domain/entities/request.entity';
import { stub, restoreAll, recorder, spyIO, SocketEmit } from '../../../helpers/stubs';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const OFFER_ID = '55555555-5555-4555-8555-555555555555';

/** Request entity as the repository would return it after persisting `data`. */
const toEntity = (data: any) => new RequestEntity(
    REQUEST_ID, data.company_id, data.product_service, data.quantity, null, data.unit_id ?? 1, 'Sacos',
    null, data.category_id ?? null, null, 'active', data.type, null, 0, null, null, null, null, null,
    null, [], 1, new Date(), new Date(), data.target_company_id ?? null, data.company_offer_id ?? null
);

const buildInput = (overrides: any = {}) => ({
    company_id: BUYER,
    product_service: 'Cemento gris',
    quantity: 10,
    type: 1,
    ...overrides,
});

let emits: SocketEmit[];
let matching: ReturnType<typeof recorder>;
let emails: ReturnType<typeof recorder>;
let notifications: ReturnType<typeof recorder>;

beforeEach(() => {
    emits = spyIO();
    matching = recorder(async () => ({}));
    emails = recorder(async () => ({}));
    notifications = recorder(async ({ data }: any) => ({ id: 'notif', ...data, created_at: new Date() }));
    stub(matchingQueue, 'add', matching);
    stub(notificationsQueue, 'add', emails);
    stub(prisma.notification, 'create', notifications);
});

afterEach(restoreAll);

function createUseCase(offer: any = { id: OFFER_ID, company_id: SUPPLIER, category_id: 7 }) {
    const create = recorder(async (data: any) => toEntity(data));
    const invitations = recorder(async () => ({}));
    const useCase = new CreateRequestUseCase();
    (useCase as any).requestRepository = { create };
    (useCase as any).companyOfferRepository = { findActiveById: async () => offer };
    (useCase as any).invitationRepository = { create: invitations };
    return { useCase, create, invitations };
}

describe('CreateRequestUseCase — open RFQ (regression)', () => {
    test('enqueues matching and does not deliver directly', async () => {
        const { useCase, create, invitations } = createUseCase();
        const result = await useCase.execute(buildInput({ category_id: 3 }));

        assert.equal(create.calls[0][0].target_company_id, undefined);
        assert.deepEqual(matching.calls[0].slice(0, 2), ['match-rfq', { rfqId: REQUEST_ID }]);
        assert.equal(invitations.calls.length, 0);
        assert.equal(emails.calls.length, 0);
        assert.equal(notifications.calls.length, 0);
        assert.equal(result.is_direct, false);
    });
});

describe('CreateRequestUseCase — direct RFQ', () => {
    test('targets the offer company and delivers only to it, without matching', async () => {
        const { useCase, create, invitations } = createUseCase();
        const result = await useCase.execute(buildInput({ company_offer_id: OFFER_ID }));

        const persisted = create.calls[0][0];
        assert.equal(persisted.target_company_id, SUPPLIER);
        assert.equal(persisted.company_offer_id, OFFER_ID);
        assert.equal(matching.calls.length, 0);

        assert.equal(invitations.calls.length, 1);
        assert.deepEqual(invitations.calls[0][0], { requestId: REQUEST_ID, companyId: SUPPLIER, tier: 1, score: 1 });
        assert.deepEqual(emails.calls[0].slice(0, 2), ['rfq-match-email', { companyId: SUPPLIER, requestId: REQUEST_ID }]);

        assert.equal(notifications.calls[0][0].data.company_id, SUPPLIER);
        assert.equal(notifications.calls[0][0].data.link, `/prospects/${REQUEST_ID}`);
        assert.ok(emits.some(e => e.event === 'notification:new' && e.room === `company_${SUPPLIER}`));

        assert.equal(result.is_direct, true);
        assert.equal(result.target_company_id, SUPPLIER);
    });

    test('takes the category from the offer when the form does not send it', async () => {
        const { useCase, create } = createUseCase();
        await useCase.execute(buildInput({ company_offer_id: OFFER_ID }));
        assert.equal(create.calls[0][0].category_id, 7);
    });

    test('keeps the category chosen in the form', async () => {
        const { useCase, create } = createUseCase();
        await useCase.execute(buildInput({ company_offer_id: OFFER_ID, category_id: 3 }));
        assert.equal(create.calls[0][0].category_id, 3);
    });

    test('a delivery failure does not break the request creation', async () => {
        const { useCase } = createUseCase();
        (useCase as any).invitationRepository = { create: async () => { throw new Error('db down'); } };

        const result = await useCase.execute(buildInput({ company_offer_id: OFFER_ID }));
        assert.equal(result.is_direct, true);
        assert.equal(matching.calls.length, 0);
    });
});

describe('MatchRfqToSuppliersUseCase', () => {
    function matchUseCase(targetCompanyId: string | null) {
        const list = recorder(async () => ({ data: [{ id: SUPPLIER, locations: [] }] }));
        const invitations = recorder(async () => ({}));
        const useCase = new MatchRfqToSuppliersUseCase();
        (useCase as any).requestRepo = {
            findById: async () => toEntity({
                company_id: BUYER, product_service: 'Cemento', quantity: 1, type: 'product',
                category_id: 3, target_company_id: targetCompanyId,
            })
        };
        (useCase as any).companyRepo = { list };
        (useCase as any).invitationRepo = { create: invitations };
        return { useCase, list, invitations };
    }

    test('skips direct RFQs entirely', async () => {
        const { useCase, list, invitations } = matchUseCase(SUPPLIER);
        await useCase.execute({ rfqId: REQUEST_ID });
        assert.equal(list.calls.length, 0);
        assert.equal(invitations.calls.length, 0);
        assert.equal(emails.calls.length, 0);
    });

    test('open RFQs are still matched and invited (regression)', async () => {
        const { useCase, list, invitations } = matchUseCase(null);
        await useCase.execute({ rfqId: REQUEST_ID });
        assert.equal(list.calls.length, 1);
        assert.equal(invitations.calls.length, 1);
        assert.equal(emails.calls.length, 1);
    });
});

describe('ListMarketplaceRequestsUseCase — visibility', () => {
    test('sellers see open RFQs and only the direct RFQs addressed to them', async () => {
        const count = recorder(async () => 1);
        const findMany = recorder(async () => [{
            id: REQUEST_ID, company_id: BUYER, user_id: null, product_service: 'Cemento', quantity: '10',
            unit_id: 1, unit_of_measure: { name_es: 'Sacos' }, description: null, category_id: 3,
            category: { name_es: 'Construcción' }, status: 'active', type: 'product', reach_service: null,
            expiration_date: null, response_count: 0, files: [], company: null, quote_responses: [],
            created_at: new Date(), updated_at: new Date(),
            target_company_id: SUPPLIER, company_offer_id: OFFER_ID,
            target_company: { id: SUPPLIER, trade_name: 'Proveedor B', logo_url: null },
            offer: {
                id: OFFER_ID, name: 'Cemento gris', base_price_usd: '9.50', moq: 5,
                pricing_tiers: [{ min_quantity: 1, max_quantity: 50, price_usd: '9.00' }],
            },
        }]);
        stub(prisma.request, 'count', count);
        stub(prisma.request, 'findMany', findMany);

        const result = await new ListMarketplaceRequestsUseCase().execute({ exclude_company_id: SUPPLIER, page: 1, limit: 10 });

        const where = findMany.calls[0][0].where;
        assert.deepEqual(where.company_id, { not: SUPPLIER });
        assert.deepEqual(where.OR, [{ target_company_id: null }, { target_company_id: SUPPLIER }]);
        assert.deepEqual(count.calls[0][0].where, where);

        const item = result.data[0];
        assert.equal(item.is_direct, true);
        assert.equal(item.target_company.trade_name, 'Proveedor B');
        assert.equal(item.offer.base_price_usd, 9.5);
        assert.deepEqual(item.offer.pricing_tiers, [{ min_quantity: 1, max_quantity: 50, price_usd: 9 }]);
    });
});
