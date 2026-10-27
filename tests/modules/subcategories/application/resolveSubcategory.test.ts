import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCategoryAndSubcategory } from '../../../../src/modules/subcategories/application/helpers/resolveSubcategory';
import { InvalidSubcategoriesError, SubcategoryCategoryMismatchError } from '../../../../src/modules/subcategories/domain/errors/subcategory.errors';
import { recorder } from '../../../helpers/stubs';

// Active subcategories: 10 → category 1 (Alimentos), 20 → category 2 (Ferretería)
const ACTIVE: Record<number, { id: number; category_id: number }> = {
    10: { id: 10, category_id: 1 },
    20: { id: 20, category_id: 2 },
};
const repo = () => {
    const findActiveByIds = recorder(async (ids: number[]) => ids.map((id) => ACTIVE[id]).filter(Boolean));
    return { findActiveByIds } as any;
};

describe('resolveCategoryAndSubcategory', () => {
    test('a subcategory without category sets its category', async () => {
        assert.deepEqual(await resolveCategoryAndSubcategory(repo(), { subcategory_id: 10 }), { category_id: 1, subcategory_id: 10 });
    });

    test('a subcategory of the given category is kept', async () => {
        assert.deepEqual(
            await resolveCategoryAndSubcategory(repo(), { category_id: 1, subcategory_id: 10 }),
            { category_id: 1, subcategory_id: 10 }
        );
    });

    test('a subcategory of another category is rejected', async () => {
        await assert.rejects(
            resolveCategoryAndSubcategory(repo(), { category_id: 2, subcategory_id: 10 }),
            SubcategoryCategoryMismatchError
        );
    });

    test('an inactive or unknown subcategory is rejected', async () => {
        await assert.rejects(resolveCategoryAndSubcategory(repo(), { subcategory_id: 99 }), InvalidSubcategoriesError);
    });

    test('null or empty string clears the subcategory', async () => {
        assert.deepEqual(await resolveCategoryAndSubcategory(repo(), { subcategory_id: null }), { subcategory_id: null });
        assert.deepEqual(
            await resolveCategoryAndSubcategory(repo(), { category_id: 2, subcategory_id: '' }),
            { category_id: 2, subcategory_id: null }
        );
    });

    test('changing only the category clears a subcategory of the previous category', async () => {
        const result = await resolveCategoryAndSubcategory(repo(), { category_id: 2 }, { category_id: 1, subcategory_id: 10 });
        assert.deepEqual(result, { category_id: 2, subcategory_id: null });
    });

    test('keeping the same category keeps the current subcategory', async () => {
        const result = await resolveCategoryAndSubcategory(repo(), { category_id: 1 }, { category_id: 1, subcategory_id: 10 });
        assert.deepEqual(result, { category_id: 1 });
    });

    test('nothing sent → nothing changes (and no lookup)', async () => {
        const r = repo();
        assert.deepEqual(await resolveCategoryAndSubcategory(r, {}, { category_id: 1, subcategory_id: 10 }), {});
        assert.equal(r.findActiveByIds.calls.length, 0);
    });
});
