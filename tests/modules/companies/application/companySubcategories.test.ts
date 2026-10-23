import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { deriveInterestTaxonomy, findSelectedSubcategories } from '../../../../src/modules/companies/application/helpers/interestTaxonomy';
import { UpdateCompanyUseCase } from '../../../../src/modules/companies/application/updateCompanyUseCase';
import { PrismaCompanyRepository } from '../../../../src/modules/companies/infrastructure/persistence/PrismaCompanyRepository';
import { InvalidSubcategoriesError } from '../../../../src/modules/subcategories/domain/errors/subcategory.errors';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

// Categories: 1 = Alimentos, 2 = Ferretería. Subcategories: 10/11 → Alimentos, 20 → Ferretería
const SUBS: Record<number, { id: number; category_id: number }> = {
    10: { id: 10, category_id: 1 },
    11: { id: 11, category_id: 1 },
    20: { id: 20, category_id: 2 },
};
const subRepo = (active: number[] = [10, 11, 20]) => ({
    findActiveByIds: async (ids: number[]) => ids.filter((id) => active.includes(id)).map((id) => SUBS[id]),
});

afterEach(restoreAll);

describe('deriveInterestTaxonomy', () => {
    test('choosing subcategories adds their parent categories', () => {
        const result = deriveInterestTaxonomy(
            { interest_category_ids: [3], interest_subcategory_ids: [10, 20] },
            { categoryIds: [], subcategories: [] },
            [SUBS[10], SUBS[20]]
        );
        assert.deepEqual(result.interest_category_ids?.sort(), [1, 2, 3]);
        assert.deepEqual(result.interest_subcategory_ids, [10, 20]);
    });

    test('without interest_category_ids, keeps the current categories and adds the parents', () => {
        const result = deriveInterestTaxonomy(
            { interest_subcategory_ids: [20] },
            { categoryIds: [1], subcategories: [SUBS[10]] },
            [SUBS[20]]
        );
        assert.deepEqual(result.interest_category_ids?.sort(), [1, 2]);
        assert.deepEqual(result.interest_subcategory_ids, [20]);
    });

    test('removing a category (old clients) drops its active subcategories', () => {
        const result = deriveInterestTaxonomy(
            { interest_category_ids: [2] },
            { categoryIds: [1, 2], subcategories: [SUBS[10], SUBS[20]] },
            []
        );
        assert.deepEqual(result, { interest_category_ids: [2], interest_subcategory_ids: [20] });
    });

    test('categories only, nothing to drop → same behavior as before (regression)', () => {
        const result = deriveInterestTaxonomy(
            { interest_category_ids: [1, 2] },
            { categoryIds: [1], subcategories: [SUBS[10]] },
            []
        );
        assert.deepEqual(result, { interest_category_ids: [1, 2] });
    });

    test('nothing sent → nothing changes', () => {
        assert.deepEqual(deriveInterestTaxonomy({}, { categoryIds: [1], subcategories: [SUBS[10]] }, []), {});
    });
});

describe('findSelectedSubcategories', () => {
    test('rejects unknown or inactive subcategories', async () => {
        await assert.rejects(findSelectedSubcategories(subRepo([10]) as any, [10, 11, 99]), (err: any) => {
            assert.ok(err instanceof InvalidSubcategoriesError);
            assert.deepEqual(err.details.ids, [11, 99]);
            return true;
        });
    });

    test('returns the active ones (deduplicated)', async () => {
        assert.deepEqual(await findSelectedSubcategories(subRepo() as any, [10, 10, 20]), [SUBS[10], SUBS[20]]);
    });
});

describe('UpdateCompanyUseCase with subcategories', () => {
    function setup(current: { categoryIds: number[]; subcategories: any[] }) {
        const update = recorder(async (id: string, data: any) => ({ id, trade_name: 'Acme', created_at: new Date(), ...data }));
        const useCase = new UpdateCompanyUseCase();
        (useCase as any).companyRepository = {
            findById: async () => ({
                id: COMPANY_ID,
                categories_of_interest: current.categoryIds.map((id) => ({ id, name: `cat ${id}` })),
                subcategories_of_interest: current.subcategories,
            }),
            update,
        };
        (useCase as any).subcategoryRepository = subRepo();
        return { useCase, update };
    }

    test('sends the derived categories and the subcategories to the repository', async () => {
        const { useCase, update } = setup({ categoryIds: [], subcategories: [] });
        await useCase.execute({ id: COMPANY_ID, interest_category_ids: [], interest_subcategory_ids: [10] });
        const data = update.calls[0][1];
        assert.deepEqual(data.interest_category_ids, [1]);
        assert.deepEqual(data.interest_subcategory_ids, [10]);
    });

    test('an inactive subcategory is rejected (400) and nothing is saved', async () => {
        const { useCase, update } = setup({ categoryIds: [], subcategories: [] });
        (useCase as any).subcategoryRepository = subRepo([10]);
        await assert.rejects(useCase.execute({ id: COMPANY_ID, interest_subcategory_ids: [11] }), InvalidSubcategoriesError);
        assert.equal(update.calls.length, 0);
    });
});

describe('PrismaCompanyRepository subcategories', () => {
    test('update replaces only the links to ACTIVE subcategories (inactive ones are preserved)', async () => {
        stub(prisma.companyContact, 'findFirst', async () => null);
        const companyUpdate = recorder(async () => ({ id: COMPANY_ID, subcategories_of_interest: [] }));
        stub(prisma.company, 'update', companyUpdate);

        await new PrismaCompanyRepository().update(COMPANY_ID, { interest_subcategory_ids: [10, 20] });

        const { data, include } = companyUpdate.calls[0][0];
        assert.deepEqual(data.subcategories_of_interest, {
            deleteMany: { subcategory: { is_active: true } },
            create: [
                { subcategory: { connect: { id: 10 } } },
                { subcategory: { connect: { id: 20 } } },
            ],
        });
        // Reads only expose active subcategories
        assert.deepEqual(include.subcategories_of_interest.where, { subcategory: { is_active: true, category: { is_active: true } } });
    });

    test('update without interest_subcategory_ids does not touch subcategories (regression)', async () => {
        stub(prisma.companyContact, 'findFirst', async () => null);
        const companyUpdate = recorder(async () => ({ id: COMPANY_ID }));
        stub(prisma.company, 'update', companyUpdate);

        await new PrismaCompanyRepository().update(COMPANY_ID, { interest_category_ids: [1] });
        assert.equal(companyUpdate.calls[0][0].data.subcategories_of_interest, undefined);
    });

    test('maps subcategories_of_interest as { id, name, category_id }', async () => {
        stub(prisma.company, 'findUnique', async () => ({
            id: COMPANY_ID,
            subcategories_of_interest: [{ subcategory: { id: 10, name_es: 'Lácteos', category_id: 1 } }],
        }));
        const company = await new PrismaCompanyRepository().findById(COMPANY_ID);
        assert.deepEqual(company?.subcategories_of_interest, [{ id: 10, name: 'Lácteos', category_id: 1 }]);
    });
});
