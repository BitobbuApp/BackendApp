// src/modules/companies/application/helpers/interestTaxonomy.ts
import { InvalidSubcategoriesError } from "../../../subcategories/domain/errors/subcategory.errors";
import { SubcategoryRepository } from "../../../subcategories/domain/repositories/subcategory.repository";

interface SubcategoryRef {
    id: number;
    category_id: number;
}

export interface InterestTaxonomyInput {
    interest_category_ids?: number[];
    interest_subcategory_ids?: number[];
}

export interface CurrentInterests {
    categoryIds: number[];
    /** Active subcategories the company already has. */
    subcategories: SubcategoryRef[];
}

/**
 * Resolves the final categories / subcategories of interest of a company.
 *
 * - Choosing a subcategory adds its parent category automatically (matching and dashboard keep using categories).
 * - Removing a category (without sending subcategories) drops its active subcategories.
 * - Fields that do not change are returned as undefined, so the repository leaves them untouched.
 *
 * `selected` are the active subcategories found for `interest_subcategory_ids` (already validated).
 */
export function deriveInterestTaxonomy(
    input: InterestTaxonomyInput,
    current: CurrentInterests,
    selected: SubcategoryRef[]
): { interest_category_ids?: number[]; interest_subcategory_ids?: number[] } {
    const { interest_category_ids, interest_subcategory_ids } = input;

    if (interest_subcategory_ids !== undefined) {
        const baseCategories = interest_category_ids ?? current.categoryIds;
        const categories = new Set([...baseCategories, ...selected.map((s) => s.category_id)]);
        return {
            interest_category_ids: [...categories],
            interest_subcategory_ids: selected.map((s) => s.id),
        };
    }

    if (interest_category_ids !== undefined) {
        const categories = new Set(interest_category_ids);
        const kept = current.subcategories.filter((s) => categories.has(s.category_id));
        return {
            interest_category_ids,
            ...(kept.length !== current.subcategories.length && { interest_subcategory_ids: kept.map((s) => s.id) }),
        };
    }

    return {};
}

/** Validates that every requested subcategory exists and is active; returns them. */
export async function findSelectedSubcategories(
    repository: SubcategoryRepository,
    ids: number[] | undefined
): Promise<SubcategoryRef[]> {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    const found = await repository.findActiveByIds(unique);
    const foundIds = new Set(found.map((s) => s.id));
    const invalid = unique.filter((id) => !foundIds.has(id));
    if (invalid.length > 0) throw new InvalidSubcategoriesError(invalid);
    return found.map((s) => ({ id: s.id, category_id: s.category_id }));
}
