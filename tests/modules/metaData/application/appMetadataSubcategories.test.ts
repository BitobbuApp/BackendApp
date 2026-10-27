import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ListAppMetaDataUseCase } from '../../../../src/modules/metaData/application/listAppMetaDataUseCase';
import { stub, restoreAll } from '../../../helpers/stubs';

afterEach(restoreAll);

describe('GET /metadata/app (ListAppMetaDataUseCase)', () => {
    test('includes the active subcategories as a flat list', async () => {
        const useCase = new ListAppMetaDataUseCase() as any;
        // Every list use case returns an empty list except subcategories
        for (const key of Object.keys(useCase).filter((k) => k.startsWith('list'))) {
            stub(useCase[key], 'execute', async () => []);
        }
        stub(useCase.listSubcategoriesUseCase, 'execute', async () => [
            { id: 10, category_id: 1, slug: 'alimentos-lacteos', name_es: 'Lácteos', name_en: 'Dairy', sort_order: 1, is_active: true },
        ]);

        const result = await useCase.execute({});
        assert.deepEqual(result.subcategories, [
            // is_active is not part of the public shape (only active ones are listed)
            { id: 10, category_id: 1, slug: 'alimentos-lacteos', name_es: 'Lácteos', name_en: 'Dairy', sort_order: 1 },
        ]);
        assert.deepEqual(result.categories, []);
    });
});
