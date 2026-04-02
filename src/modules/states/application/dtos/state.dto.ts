import Joi from "joi";

export const listStatesByCountryDtoRequestSchema = Joi.object({
    country_id: Joi.number().integer().required(),
});

const stateDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    country_id: Joi.number().integer().required(),
    name: Joi.string().required(),
    code: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const listStatesByCountryDtoResponseSchema = Joi.array().items(stateDtoSchema).required().options({ stripUnknown: true });
