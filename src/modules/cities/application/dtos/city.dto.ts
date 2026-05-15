import Joi from "joi";

const cityDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    state_id: Joi.number().integer().required(),
    name: Joi.string().required(),
    state_name: Joi.string().allow(null).required(),
}).options({ stripUnknown: true });

export const listCitiesDtoResponseSchema = Joi.array().items(cityDtoSchema).required().options({ stripUnknown: true });
export const cityDtoResponseSchema = cityDtoSchema.required().options({ stripUnknown: true });

export const adminListCitiesInputSchema = Joi.object({
    state_id: Joi.number().integer().optional(),
}).optional();

export const adminUpsertCityInputSchema = Joi.object({
    id: Joi.number().integer().optional(),
    data: Joi.object({
        state_id: Joi.number().integer().required(),
        name: Joi.string().required(),
    }).required(),
});
