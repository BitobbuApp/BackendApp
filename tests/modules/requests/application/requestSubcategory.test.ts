import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { matchingQueue, notificationsQueue } from '../../../../src/shared/infrastructure/queue/index.queue';
import { CreateRequestUseCase } from '../../../../src/modules/requests/application/createRequestUseCase';
import { UpdateRequestUseCase } from '../../../../src/modules/requests/application/updateRequestUseCase';
import { MatchRfqToSuppliersUseCase } from '../../../../src/modules/requests/application/matchRfqToSuppliersUseCase';
import { ListMarketplaceRequestsUseCase } from '../../../../src/modules/requests/application/listMarketplaceRequestsUseCase';
import { RequestEntity } from '../../../../src/modules/requests/domain/entities/request.entity';
import { SubcategoryCategoryMismatchError } from '../../../../src/modules/subcategories/domain/errors/subcategory.errors';
import { stub, restoreAll, recorder, spyIO } from '../../../helpers/stubs';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const OFFER_ID = '55555555-5555-4555-8555-555555555555';

// Active subcategories: 10 (Lácteos) and 11 → category 1; 20 → category 2
const ACTIVE: Record<number, { id: number; category_id: number }> = {
    10: { id: 10, category_id: 1 },
    11: { id: 11, category_id: 1 },
    20: { id: 20, category_id: 2 },
};
const subcategoryRepo = (active = Object.keys(ACTIVE).map(Number)) => ({
    findActiveByIds: async (ids: number[]) => ids.filter((id) => active.includes(id)).map((id) => ACTIVE[id]),
});

/** Request entity as the repository would return it after persisting `data`. */
const toEntity = (data: any) => new RequestEntity(
    REQUEST_ID, data.company_id ?? BUYER, data.product_service ?? 'Leche', data.quantity ?? 10, null, data.unit_id ?? 1, 'Litros',
    null, data.category_id ?? null, null, 'active', data.type ?? 'product', null, 0, null, null, null, null, null,
    null, [], 1, new Date(), new Date(), data.target_company_id ?? null, data.company_offer_id ?? null,
    null, null, data.subcategory_id ?? null, data.subcategory_id ? 'Lácteos' : null
);

beforeEach(() => {
    spyIO();
    stub(matchingQueue, 'add', async () => ({}));
    stub(notificationsQueue, 'add', async () => ({}));
    stub(prisma.notification, 'create', async ({ data }: any) => ({ id: 'n', ...data, created_at: new Date() }));
});

afterEach(restoreAll);

function createUseCase(offer: any = null) {
    const create = recorder(async (data: any) => toEntity(data));
    const useCase = new CreateRequestUseCase();
    (useCase as any).requestRepository = { create };
    (useCase as any).companyOfferRepository = { findActiveById: async () => offer };
    (useCase as any).invitationRepository = { create: async () => ({}) };
    (useCase as any).subcategoryRepository = subcategoryRepo();
    return { useCase, create };
}

const input = (overrides: any = {}) => ({ company_id: BUYER, product_service: 'Leche', quantity: 10, type: 1, ...overrides });

describe('CreateRequestUseCase — subcategory', () => {
    test('stores the subcategory and takes its category when none is sent', async () => {
        const { useCase, create } = createUseCase();
        const result = await useCase.execute(input({ subcategory_id: 10 }));
        assert.equal(create.calls[0][0].subcategory_id, 10);
        assert.equal(create.calls[0][0].category_id, 1);
        assert.equal(result.subcategory_id, 10);
        assert.equal(result.subcategory, 'Lácteos');
    });

    test('a subcategory of another category is rejected', async () => {
        const { useCase, create } = createUseCase();
        await assert.rejects(useCase.execute(input({ category_id: 2, subcategory_id: 10 })), SubcategoryCategoryMismatchError);
        assert.equal(create.calls.length, 0);
    });

    test('direct RFQ inherits the offer subcategory when the category is kept', async () => {
        const { useCase, create } = createUseCase({ id: OFFER_ID, company_id: SUPPLIER, category_id: 1, subcategory_id: 11 });
        await useCase.execute(input({ company_offer_id: OFFER_ID }));
        assert.equal(create.calls[0][0].category_id, 1);
        assert.equal(create.calls[0][0].subcategory_id, 11);
    });

    test('direct RFQ does not inherit it when the form chose another category', async () => {
        const { useCase, create } = createUseCase({ id: OFFER_ID, company_id: SUPPLIER, category_id: 1, subcategory_id: 11 });
        await useCase.execute(input({ company_offer_id: OFFER_ID, category_id: 2 }));
        assert.equal(create.calls[0][0].category_id, 2);
        assert.ok(!create.calls[0][0].subcategory_id);
    });

    test('direct RFQ skips an inherited subcategory that is no longer active', async () => {
        const { useCase, create } = createUseCase({ id: OFFER_ID, company_id: SUPPLIER, category_id: 1, subcategory_id: 11 });
        (useCase as any).subcategoryRepository = subcategoryRepo([10, 20]);
        await useCase.execute(input({ company_offer_id: OFFER_ID }));
        assert.ok(!create.calls[0][0].subcategory_id);
    });
});

describe('UpdateRequestUseCase — subcategory', () => {
    function updateUseCase(current: { category_id: number | null; subcategory_id: number | null }) {
        const update = recorder(async (_id: string, data: any) => toEntity({ ...current, ...data }));
        const useCase = new UpdateRequestUseCase();
        (useCase as any).requestRepository = { findById: async () => toEntity(current), update };
        (useCase as any).subcategoryRepository = subcategoryRepo();
        return { useCase, update };
    }

    test('null clears the subcategory', async () => {
        const { useCase, update } = updateUseCase({ category_id: 1, subcategory_id: 10 });
        const result = await useCase.execute({ id: REQUEST_ID, subcategory_id: null });
        assert.equal(update.calls[0][1].subcategory_id, null);
        assert.equal(result.subcategory_id, null);
    });

    test('changing only the category clears a mismatching subcategory', async () => {
        const { useCase, update } = updateUseCase({ category_id: 1, subcategory_id: 10 });
        await useCase.execute({ id: REQUEST_ID, category_id: 2 });
        assert.deepEqual([update.calls[0][1].category_id, update.calls[0][1].subcategory_id], [2, null]);
    });
});

describe('ListMarketplaceRequestsUseCase — filters (Posibles Clientes)', () => {
    test('filters by category and subcategories in the backend, keeping direct-RFQ visibility', async () => {
        const count = recorder(async () => 0);
        const findMany = recorder(async () => []);
        stub(prisma.request, 'count', count);
        stub(prisma.request, 'findMany', findMany);

        await new ListMarketplaceRequestsUseCase().execute({
            exclude_company_id: SUPPLIER, page: 2, limit: 10, category_id: 1, subcategory_ids: [10, 11],
        });

        const { where, skip } = findMany.calls[0][0];
        assert.equal(where.category_id, 1);
        assert.deepEqual(where.subcategory_id, { in: [10, 11] });
        assert.deepEqual(where.OR, [{ target_company_id: null }, { target_company_id: SUPPLIER }]);
        assert.deepEqual(count.calls[0][0].where, where);
        assert.equal(skip, 10);
    });

    test('without filters the query is the same as before (regression)', async () => {
        const findMany = recorder(async () => []);
        stub(prisma.request, 'count', async () => 0);
        stub(prisma.request, 'findMany', findMany);
        await new ListMarketplaceRequestsUseCase().execute({ exclude_company_id: SUPPLIER, page: 1, limit: 10 });
        const { where } = findMany.calls[0][0];
        assert.equal(where.category_id, undefined);
        assert.equal(where.subcategory_id, undefined);
    });
});

describe('MatchRfqToSuppliersUseCase — subcategory priority', () => {
    /** 12 suppliers of the category in the same state; by default only the last one works subcategory 10. */
    function matchUseCase(subcategoryId: number | null, worksSubcategory = (i: number) => i === 11) {
        const suppliers = Array.from({ length: 12 }, (_, i) => ({
            id: `supplier-${i}`,
            locations: [{ is_main_headquarters: true, state_id: 5, country_id: 1 }],
            subcategories_of_interest: worksSubcategory(i) ? [{ id: 10, name: 'Lácteos', category_id: 1 }] : [],
        }));
        const invitations = recorder(async () => ({}));
        const useCase = new MatchRfqToSuppliersUseCase();
        const request = toEntity({ category_id: 1, subcategory_id: subcategoryId });
        request.state_id = 5;
        (useCase as any).requestRepo = { findById: async () => request };
        (useCase as any).companyRepo = { list: async () => ({ data: suppliers }) };
        (useCase as any).invitationRepo = { create: invitations };
        return { useCase, invitations };
    }

    test('the supplier that works the subcategory is first and tier 1, the rest of the category is still invited', async () => {
        const { useCase, invitations } = matchUseCase(10);
        await useCase.execute({ rfqId: REQUEST_ID });

        const created = invitations.calls.map((call) => call[0]);
        assert.equal(created.length, 12);
        assert.equal(created[0].companyId, 'supplier-11');
        assert.equal(created[0].tier, 1);
        assert.equal(created[0].score, 0.85);
        assert.equal(created.filter((i) => i.tier === 1).length, 10);
    });

    test('every supplier that works the subcategory is tier 1, even beyond the top 10', async () => {
        const { useCase, invitations } = matchUseCase(10, () => true);
        await useCase.execute({ rfqId: REQUEST_ID });
        const created = invitations.calls.map((call) => call[0]);
        assert.equal(created.length, 12);
        assert.ok(created.every((i) => i.tier === 1));
    });

    test('without subcategory the scoring is the same as before (regression)', async () => {
        const { useCase, invitations } = matchUseCase(null);
        await useCase.execute({ rfqId: REQUEST_ID });
        const created = invitations.calls.map((call) => call[0]);
        assert.ok(created.every((i) => i.score === 0.35));
        assert.equal(created[0].companyId, 'supplier-0');
    });
});
