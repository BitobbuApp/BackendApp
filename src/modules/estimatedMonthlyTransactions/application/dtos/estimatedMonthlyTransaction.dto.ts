import Joi from "joi";

const estimatedMonthlyTransactionSchema = Joi.object({
    id: Joi.string().required(),
    range_name: Joi.string().required(),
    description: Joi.string().allow(null, "").optional(),
    description_es: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const listEstimatedMonthlyTransactionsDtoResponseSchema = Joi.array()
    .items(estimatedMonthlyTransactionSchema)
    .required()
    .options({ stripUnknown: true });
