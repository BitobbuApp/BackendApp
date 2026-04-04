import Joi from "joi";

const paymentConditionSchema = Joi.object({
    id: Joi.string().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    days_to_due: Joi.number().integer().required(),
    description: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listPaymentConditionsDtoResponseSchema = Joi.array()
    .items(paymentConditionSchema)
    .required()
    .options({ stripUnknown: true });
