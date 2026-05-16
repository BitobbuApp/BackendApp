import Joi from "joi";

const unitOfMeasureDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().allow(null).optional(),
    abbreviation: Joi.string().required(),
}).options({ stripUnknown: true });

export const listUnitsOfMeasureDtoResponseSchema = Joi.array().items(unitOfMeasureDtoSchema).required().options({ stripUnknown: true });
