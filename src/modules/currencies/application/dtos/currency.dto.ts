import Joi from "joi";

const currencyDtoSchema = Joi.object({
    code: Joi.string().length(3).required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    symbol: Joi.string().required(),
    decimal_places: Joi.number().integer().min(0).required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listCurrenciesDtoResponseSchema = Joi.array().items(currencyDtoSchema).required().options({ stripUnknown: true });
export const currencyDtoResponseSchema = currencyDtoSchema.required().options({ stripUnknown: true });

export const adminUpsertCurrencyInputSchema = Joi.object({
    code: Joi.string().length(3).optional(),
    data: Joi.object({
        code: Joi.string().length(3).required(),
        name_en: Joi.string().required(),
        name_es: Joi.string().required(),
        symbol: Joi.string().required(),
        decimal_places: Joi.number().integer().min(0).required(),
        is_active: Joi.boolean().optional(),
    }).required(),
});

export const adminUpdateCurrencyStatusInputSchema = Joi.object({
    code: Joi.string().length(3).required(),
    is_active: Joi.boolean().required(),
});
