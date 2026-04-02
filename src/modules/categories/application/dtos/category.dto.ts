import Joi from "joi";

const categoryDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    slug: Joi.string().required(),
    icon: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listCategoriesDtoResponseSchema = Joi.array().items(categoryDtoSchema).required().options({ stripUnknown: true });
