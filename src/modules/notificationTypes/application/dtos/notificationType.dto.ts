import Joi from "joi";

const notificationTypeDtoSchema = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
    icon: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const listNotificationTypesDtoResponseSchema = Joi.array().items(notificationTypeDtoSchema).required().options({ stripUnknown: true });
