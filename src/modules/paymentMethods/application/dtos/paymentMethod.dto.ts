import Joi from "joi";

const paymentMethodDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listPaymentMethodsDtoResponseSchema = Joi.array().items(paymentMethodDtoSchema).required().options({ stripUnknown: true });
