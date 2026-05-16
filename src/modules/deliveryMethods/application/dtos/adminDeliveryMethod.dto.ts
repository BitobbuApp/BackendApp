import Joi from "joi";

const deliveryMethodDtoSchema = Joi.object({
    id: Joi.string().required(),
    country_id: Joi.number().integer().required(),
    name: Joi.string().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const adminListDeliveryMethodsInputSchema = Joi.object({
    country_id: Joi.number().integer().optional(),
}).optional();

export const listDeliveryMethodsAdminDtoResponseSchema = Joi.array().items(deliveryMethodDtoSchema).required().options({ stripUnknown: true });
export const deliveryMethodAdminDtoResponseSchema = deliveryMethodDtoSchema.required().options({ stripUnknown: true });

export const adminUpsertDeliveryMethodInputSchema = Joi.object({
    id: Joi.string().optional(),
    data: Joi.object({
        country_id: Joi.number().integer().required(),
        name: Joi.string().required(),
        is_active: Joi.boolean().optional(),
    }).required(),
});

export const adminUpdateDeliveryMethodStatusInputSchema = Joi.object({
    id: Joi.string().required(),
    is_active: Joi.boolean().required(),
});
