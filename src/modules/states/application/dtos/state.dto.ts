import Joi from "joi";

export const listStatesByCountryDtoRequestSchema = Joi.object({
    country_id: Joi.number().integer().required(),
});

const stateDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    country_id: Joi.number().integer().required(),
    name: Joi.string().required(),
    code: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listStatesByCountryDtoResponseSchema = Joi.array().items(stateDtoSchema).required().options({ stripUnknown: true });
export const stateDtoResponseSchema = stateDtoSchema.required().options({ stripUnknown: true });

export const adminListStatesInputSchema = Joi.object({
    country_id: Joi.number().integer().optional(),
}).optional();

export const adminUpsertStateInputSchema = Joi.object({
    id: Joi.number().integer().optional(),
    data: Joi.object({
        country_id: Joi.number().integer().required(),
        name: Joi.string().required(),
        code: Joi.string().allow(null, "").optional(),
        is_active: Joi.boolean().optional(),
    }).required()
});

export const adminUpdateStateStatusInputSchema = Joi.object({
    id: Joi.number().integer().required(),
    status: Joi.boolean().required(),
});
