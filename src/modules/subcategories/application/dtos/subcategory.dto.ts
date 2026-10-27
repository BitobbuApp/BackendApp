import Joi from "joi";

// --- Response Schemas ---

/** Public shape (app metadata): active subcategories only. */
export const subcategoryDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    category_id: Joi.number().integer().required(),
    slug: Joi.string().required(),
    name_es: Joi.string().required(),
    name_en: Joi.string().required(),
    sort_order: Joi.number().integer().required(),
}).options({ stripUnknown: true });

export const listSubcategoriesDtoResponseSchema = Joi.array().items(subcategoryDtoSchema).required().options({ stripUnknown: true });

/** Admin shape: includes status, parent name and how many companies use it. */
const adminSubcategoryDtoSchema = subcategoryDtoSchema.keys({
    is_active: Joi.boolean().required(),
    category_name: Joi.string().allow(null).optional(),
    company_count: Joi.number().integer().allow(null).optional(),
});

export const adminSubcategoryDtoResponseSchema = adminSubcategoryDtoSchema.required();
export const adminListSubcategoriesDtoResponseSchema = Joi.array().items(adminSubcategoryDtoSchema).required();

// --- Request Schemas ---

export const adminListSubcategoriesInputSchema = Joi.object({
    category_id: Joi.number().integer().min(1).optional(),
});

export const adminCreateSubcategoryInputSchema = Joi.object({
    category_id: Joi.number().integer().min(1).required(),
    name_es: Joi.string().trim().min(2).max(100).required(),
    name_en: Joi.string().trim().max(100).allow(null, '').optional(),
    slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional(),
    sort_order: Joi.number().integer().min(0).max(32767).default(0),
});

// category_id and slug are immutable: moving a subcategory would break the categories derived for companies
export const adminUpdateSubcategoryInputSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    data: Joi.object({
        name_es: Joi.string().trim().min(2).max(100).optional(),
        name_en: Joi.string().trim().max(100).optional(),
        sort_order: Joi.number().integer().min(0).max(32767).optional(),
    }).min(1).required(),
});

export const adminUpdateSubcategoryStatusInputSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    is_active: Joi.boolean().required(),
});
