import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { AdminCreateSubcategoryUseCase } from '../../../../src/modules/subcategories/application/adminCreateSubcategoryUseCase';
import { AdminUpdateSubcategoryUseCase } from '../../../../src/modules/subcategories/application/adminUpdateSubcategoryUseCase';
import { AdminUpdateSubcategoryStatusUseCase } from '../../../../src/modules/subcategories/application/adminUpdateSubcategoryStatusUseCase';
import { PrismaSubcategoryRepository } from '../../../../src/modules/subcategories/infrastructure/persistence/PrismaSubcategoryRepository';
import { buildSubcategorySlug } from '../../../../src/modules/subcategories/application/helpers/slugify';
import { SubcategoryEntity } from '../../../../src/modules/subcategories/domain/entities/subcategory.entity';
import {
    SubcategoryCategoryNotFoundError,
    SubcategoryConflictError,
    SubcategoryNotFoundError,
} from '../../../../src/modules/subcategories/domain/errors/subcategory.errors';
import { ValidationError } from '../../../../src/shared/domain/error';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const sub = (overrides: Partial<SubcategoryEntity> = {}) =>
    Object.assign(new SubcategoryEntity(10, 1, 'alimentos-lacteos', 'Lácteos', 'Dairy', true, 1, 'Alimentos', 3), overrides);

/** Fake repository: echoes writes as entities. */
function fakeRepo(overrides: any = {}) {
    return {
        findCategory: async (id: number) => (id === 1 ? { id: 1, slug: 'alimentos' } : null),
        findById: async (id: number) => (id === 10 ? sub() : null),
        create: recorder(async (data: any) => sub({ ...data, id: 11, company_count: null })),
        update: recorder(async (id: number, data: any) => sub({ id, ...data })),
        updateStatus: recorder(async (id: number, is_active: boolean) => sub({ id, is_active })),
        ...overrides,
    };
}

const withRepo = <T>(useCase: T, repo: any): T => {
    (useCase as any).subcategoryRepository = repo;
    return useCase;
};

afterEach(restoreAll);

describe('slug helper', () => {
    test('builds a global slug from the category slug and the name, without accents', () => {
        assert.equal(buildSubcategorySlug('alimentos', 'Lácteos y Huevos'), 'alimentos-lacteos-y-huevos');
        assert.equal(buildSubcategorySlug('seguridad', 'Señalización (vial)'), 'seguridad-senalizacion-vial');
    });
});

describe('AdminCreateSubcategoryUseCase', () => {
    test('creates with generated slug and name_en defaulting to name_es', async () => {
        const repo = fakeRepo();
        const result = await withRepo(new AdminCreateSubcategoryUseCase(), repo)
            .execute({ category_id: 1, name_es: '  Cárnicos ' });

        assert.deepEqual(repo.create.calls[0][0], {
            category_id: 1,
            slug: 'alimentos-carnicos',
            name_es: 'Cárnicos',
            name_en: 'Cárnicos',
            sort_order: 0,
        });
        assert.equal(result.company_count, 0);
        assert.equal(result.is_active, true);
    });

    test('rejects an unknown category', async () => {
        const repo = fakeRepo();
        await assert.rejects(
            withRepo(new AdminCreateSubcategoryUseCase(), repo).execute({ category_id: 99, name_es: 'Lácteos' }),
            SubcategoryCategoryNotFoundError
        );
        assert.equal(repo.create.calls.length, 0);
    });

    test('a duplicated name/slug is reported as a conflict (409)', async () => {
        stub(prisma.subcategory, 'create', async () => { throw Object.assign(new Error('unique'), { code: 'P2002' }); });
        const useCase = new AdminCreateSubcategoryUseCase();
        (useCase as any).subcategoryRepository.findCategory = async () => ({ id: 1, slug: 'alimentos' });
        await assert.rejects(useCase.execute({ category_id: 1, name_es: 'Lácteos' }), SubcategoryConflictError);
    });
});

describe('AdminUpdateSubcategoryUseCase', () => {
    test('updates names and order', async () => {
        const repo = fakeRepo();
        const result = await withRepo(new AdminUpdateSubcategoryUseCase(), repo)
            .execute({ id: 10, data: { name_es: 'Lácteos y quesos', sort_order: 2 } });
        assert.deepEqual(repo.update.calls[0], [10, { name_es: 'Lácteos y quesos', sort_order: 2 }]);
        assert.equal(result.name_es, 'Lácteos y quesos');
    });

    test('category_id and slug are immutable', async () => {
        const repo = fakeRepo();
        const update = (data: any) => withRepo(new AdminUpdateSubcategoryUseCase(), repo).execute({ id: 10, data });
        await assert.rejects(update({ category_id: 2 }), ValidationError);
        await assert.rejects(update({ slug: 'otro-slug' }), ValidationError);
        assert.equal(repo.update.calls.length, 0);
    });

    test('unknown subcategory → 404', async () => {
        await assert.rejects(
            withRepo(new AdminUpdateSubcategoryUseCase(), fakeRepo()).execute({ id: 77, data: { name_es: 'X y Y' } }),
            SubcategoryNotFoundError
        );
    });
});

describe('AdminUpdateSubcategoryStatusUseCase', () => {
    test('deactivates and reactivates', async () => {
        const repo = fakeRepo();
        const useCase = withRepo(new AdminUpdateSubcategoryStatusUseCase(), repo);
        assert.equal((await useCase.execute({ id: 10, is_active: false })).is_active, false);
        assert.equal((await useCase.execute({ id: 10, is_active: true })).is_active, true);
        assert.deepEqual(repo.updateStatus.calls, [[10, false], [10, true]]);
    });

    test('is_active is required', async () => {
        await assert.rejects(
            withRepo(new AdminUpdateSubcategoryStatusUseCase(), fakeRepo()).execute({ id: 10 }),
            ValidationError
        );
    });
});

describe('PrismaSubcategoryRepository', () => {
    test('never deletes: the repository has no delete method', () => {
        const repo = new PrismaSubcategoryRepository() as any;
        assert.equal(repo.delete, undefined);
    });

    test('listActive only returns active subcategories of active categories', async () => {
        const findMany = recorder(async () => []);
        stub(prisma.subcategory, 'findMany', findMany);
        await new PrismaSubcategoryRepository().listActive();
        assert.deepEqual(findMany.calls[0][0].where, { is_active: true, category: { is_active: true } });
    });
});
