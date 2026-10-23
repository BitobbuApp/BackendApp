import { ApplicationError } from "../../../../shared/domain/error";

export class SubcategoryNotFoundError extends ApplicationError {
    constructor(id: number) {
        super(404, `Subcategory with ID ${id} not found`, "SUBCATEGORY_NOT_FOUND", "NOT_FOUND");
    }
}

export class SubcategoryCategoryNotFoundError extends ApplicationError {
    constructor(categoryId: number) {
        super(404, `Category with ID ${categoryId} not found`, "CATEGORY_NOT_FOUND", "NOT_FOUND");
    }
}

export class SubcategoryConflictError extends ApplicationError {
    constructor() {
        super(409, "A subcategory with the same name or slug already exists", "SUBCATEGORY_CONFLICT", "CONFLICT");
    }
}

export class InvalidSubcategoriesError extends ApplicationError {
    constructor(ids: number[]) {
        super(400, `Invalid or inactive subcategories: ${ids.join(', ')}`, "INVALID_SUBCATEGORIES", "VALIDATION", { ids });
    }
}
