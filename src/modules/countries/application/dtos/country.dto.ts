import Joi from "joi";

const countryDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_es: Joi.string().required(),
    name_en: Joi.string().required(),
    iso_code: Joi.string().length(2).required(),
    phone_code: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listCountriesDtoResponseSchema = Joi.array().items(countryDtoSchema).required().options({ stripUnknown: true });
