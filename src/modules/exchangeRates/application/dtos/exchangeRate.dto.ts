import Joi from "joi";

const exchangeRateDtoSchema = Joi.object({
    id: Joi.string().required(),
    from_currency: Joi.string().length(3).required(),
    to_currency: Joi.string().length(3).required(),
    rate: Joi.number().required(),
    source: Joi.string().required(),
    effective_date: Joi.date().required(),
}).options({ stripUnknown: true });

export const listExchangeRatesDtoResponseSchema = Joi.array().items(exchangeRateDtoSchema).required().options({ stripUnknown: true });
export const exchangeRateDtoResponseSchema = exchangeRateDtoSchema.required().options({ stripUnknown: true });

export const adminListExchangeRatesInputSchema = Joi.object({
    from_currency: Joi.string().length(3).optional(),
    to_currency: Joi.string().length(3).optional(),
    effective_date: Joi.string().optional(),
}).optional();

export const adminUpsertExchangeRateInputSchema = Joi.object({
    id: Joi.string().optional(),
    data: Joi.object({
        from_currency: Joi.string().length(3).required(),
        to_currency: Joi.string().length(3).required(),
        rate: Joi.number().positive().required(),
        source: Joi.string().required(),
        effective_date: Joi.date().required(),
    }).required(),
});
