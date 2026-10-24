import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { CreateCompanyOfferUseCase } from '../../../../src/modules/companyOffers/application/createCompanyOfferUseCase';
import { UpdateCompanyOfferUseCase } from '../../../../src/modules/companyOffers/application/updateCompanyOfferUseCase';
import { SearchMarketplaceOffersUseCase } from '../../../../src/modules/companyOffers/application/searchMarketplaceOffersUseCase';
import { SubcategoryCategoryMismatchError } from '../../../../src/modules/subcategories/domain/errors/subcategory.errors';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const OFFER_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY = '22222222-2222-4222-8222-222222222222';

const ACTIVE: Record<number, { id: number; category_id: number }> = {
    10: { id: 10, category_id: 1 },
    20: { id: 20, category_id: 2 },
};
const subcategoryRepo = {
    findActiveByIds: async (ids: number[]) => ids.map((id) => ACTIVE[id]).filter(Boolean),
};

const offer = (overrides: any = {}) => ({
    id: OFFER_ID, company_id: COMPANY, name: 'Leche', is_active: true, photos: [], pricing_tiers: [],
    category_id: 1, subcategory_id: 10, ...overrides,
});

afterEach(restoreAll);

describe('CreateCompanyOfferUseCase — subcategory', () => {
    function setup() {
        const create = recorder(async (data: any) => offer({ ...data }));
        const useCase = new CreateCompanyOfferUseCase();
        (useCase as any).companyOfferRepository = { create };
        (useCase as any).subcategoryRepository = subcategoryRepo;
        return { useCase, create };
    }

    test('multipart string subcategory is accepted and sets the category', async () => {
        const { useCase, create } = setup();
        const result = await useCase.execute({ company_id: COMPANY, name: 'Leche', subcategory_id: '10' });
        assert.equal(create.calls[0][0].subcategory_id, 10);
        assert.equal(create.calls[0][0].category_id, 1);
        assert.equal(result.subcategory_id, 10);
    });

    test('a subcategory of another category is rejected', async () => {
        const { useCase, create } = setup();
        await assert.rejects(
            useCase.execute({ company_id: COMPANY, name: 'Leche', category_id: 2, subcategory_id: 10 }),
            SubcategoryCategoryMismatchError
        );
        assert.equal(create.calls.length, 0);
    });
});

describe('UpdateCompanyOfferUseCase — subcategory', () => {
    function setup(current = offer()) {
        const update = recorder(async (_id: string, data: any) => ({ ...current, ...data }));
        const useCase = new UpdateCompanyOfferUseCase();
        (useCase as any).companyOfferRepository = { findById: async () => current, update };
        (useCase as any).subcategoryRepository = subcategoryRepo;
        return { useCase, update };
    }

    test('changing the category clears the subcategory of the previous one', async () => {
        const { useCase, update } = setup();
        await useCase.execute({ id: OFFER_ID, requester_company_id: COMPANY, category_id: 2 });
        assert.deepEqual([update.calls[0][1].category_id, update.calls[0][1].subcategory_id], [2, null]);
    });

    test('an empty string clears the subcategory', async () => {
        const { useCase, update } = setup();
        await useCase.execute({ id: OFFER_ID, requester_company_id: COMPANY, subcategory_id: '' });
        assert.equal(update.calls[0][1].subcategory_id, null);
    });
});

describe('SearchMarketplaceOffersUseCase — subcategory filter', () => {
    test('filters products by category and subcategory', async () => {
        const findMany = recorder(async () => []);
        stub(prisma.companyOffer, 'count', async () => 0);
        stub(prisma.companyOffer, 'findMany', findMany);

        await new SearchMarketplaceOffersUseCase().execute({ categoryId: '1', subcategoryId: '10' });

        const { where } = findMany.calls[0][0];
        assert.equal(where.category_id, 1);
        assert.equal(where.subcategory_id, 10);
    });

    test('without subcategory filter it is not applied (regression)', async () => {
        const findMany = recorder(async () => []);
        stub(prisma.companyOffer, 'count', async () => 0);
        stub(prisma.companyOffer, 'findMany', findMany);
        await new SearchMarketplaceOffersUseCase().execute({ categoryId: '1' });
        assert.equal(findMany.calls[0][0].where.subcategory_id, undefined);
    });
});
