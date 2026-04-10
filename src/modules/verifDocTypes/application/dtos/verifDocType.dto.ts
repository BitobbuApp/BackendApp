import Joi from "joi";

const verifDocTypeDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().allow(null, "").optional(),
    instructions: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const listVerifDocTypesDtoResponseSchema = Joi.array().items(verifDocTypeDtoSchema).required().options({ stripUnknown: true });
