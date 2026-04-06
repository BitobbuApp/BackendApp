import Joi from "joi";

export const deliveryMethodResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    country_id: Joi.number().integer().required(),
    name: Joi.string().required(),
    is_active: Joi.boolean().required()
}).options({ stripUnknown: true });

export const deliveryMethodListResponseSchema = Joi.array().items(deliveryMethodResponseSchema);
