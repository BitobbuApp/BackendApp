import Joi from "joi";

const verifDocTypeDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
    instructions: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const listVerifDocTypesDtoResponseSchema = Joi.array().items(verifDocTypeDtoSchema).required().options({ stripUnknown: true });
