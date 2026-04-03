import Joi from "joi";

const companyTypeDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    description: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const listCompanyTypesDtoResponseSchema = Joi.array().items(companyTypeDtoSchema).required().options({ stripUnknown: true });
