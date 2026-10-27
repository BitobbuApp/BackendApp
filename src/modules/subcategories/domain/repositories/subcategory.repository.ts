import { SubcategoryEntity } from "../entities/subcategory.entity";

export interface CreateSubcategoryData {
    category_id: number;
    slug: string;
    name_es: string;
    name_en: string;
    sort_order: number;
}

export interface UpdateSubcategoryData {
    name_es?: string;
    name_en?: string;
    sort_order?: number;
}

/**
 * Subcategories are never deleted (only deactivated), so there is intentionally no delete method.
 */
export interface SubcategoryRepository {
    /** Active subcategories of active categories (public metadata). */
    listActive(): Promise<SubcategoryEntity[]>;
    /** Every subcategory (active and inactive) with its company count, optionally for one category. */
    listAdmin(categoryId?: number): Promise<SubcategoryEntity[]>;
    findById(id: number): Promise<SubcategoryEntity | null>;
    /** Only the active ones among the given ids (used to validate a company's selection). */
    findActiveByIds(ids: number[]): Promise<SubcategoryEntity[]>;
    findCategory(categoryId: number): Promise<{ id: number; slug: string } | null>;
    create(data: CreateSubcategoryData): Promise<SubcategoryEntity>;
    update(id: number, data: UpdateSubcategoryData): Promise<SubcategoryEntity>;
    updateStatus(id: number, isActive: boolean): Promise<SubcategoryEntity>;
}
