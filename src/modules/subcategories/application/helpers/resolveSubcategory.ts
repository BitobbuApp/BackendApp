// src/modules/subcategories/application/helpers/resolveSubcategory.ts
import { SubcategoryRepository } from "../../domain/repositories/subcategory.repository";
import { InvalidSubcategoriesError, SubcategoryCategoryMismatchError } from "../../domain/errors/subcategory.errors";

export interface CategorySelection {
    category_id?: number | null;
    /** '' comes from multipart / cleared selects and means "no subcategory". */
    subcategory_id?: number | null | '';
}

export interface CurrentCategorySelection {
    category_id: number | null;
    subcategory_id: number | null;
}

/**
 * Resolves the (optional) subcategory of an RFQ or a product together with its category.
 *
 * - A subcategory must exist, be active and belong to the given category (if one is given);
 *   without a category, the subcategory's category is used.
 * - null / '' clears the subcategory.
 * - On updates (`current`), changing only the category clears a subcategory of another category.
 * - Fields that do not change are left out of the result (the repository keeps them as they are).
 */
export async function resolveCategoryAndSubcategory(
    repository: SubcategoryRepository,
    input: CategorySelection,
    current?: CurrentCategorySelection
): Promise<{ category_id?: number | null; subcategory_id?: number | null }> {
    const { category_id, subcategory_id } = input;

    if (subcategory_id === undefined) {
        // Only the category changes: drop a subcategory that belongs to another category
        if (current?.subcategory_id && category_id !== undefined && category_id !== current.category_id) {
            return { category_id, subcategory_id: null };
        }
        return category_id === undefined ? {} : { category_id };
    }

    if (subcategory_id === null || subcategory_id === '') {
        return { ...(category_id !== undefined && { category_id }), subcategory_id: null };
    }

    const [subcategory] = await repository.findActiveByIds([subcategory_id]);
    if (!subcategory) throw new InvalidSubcategoriesError([subcategory_id]);

    if (category_id !== undefined && category_id !== null && category_id !== subcategory.category_id) {
        throw new SubcategoryCategoryMismatchError(subcategory_id, category_id);
    }

    return { category_id: subcategory.category_id, subcategory_id };
}
