import Joi from "joi";

const unitOfMeasureDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
    abbreviation: Joi.string().required(),
}).options({ stripUnknown: true });

export const listUnitsOfMeasureDtoResponseSchema = Joi.array().items(unitOfMeasureDtoSchema).required().options({ stripUnknown: true });
