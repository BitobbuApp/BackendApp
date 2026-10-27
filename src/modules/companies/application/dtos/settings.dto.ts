import Joi from 'joi';

export const updateSettingsDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    receive_email_notifications: Joi.boolean(),
    receive_web_notifications: Joi.boolean(),
    two_factor_required: Joi.boolean()
});

export const settingsDtoResponseSchema = Joi.object({
    company_id: Joi.string().required(),
    receive_email_notifications: Joi.boolean().required(),
    receive_web_notifications: Joi.boolean().required(),
    two_factor_required: Joi.boolean().default(false)
}).options({ stripUnknown: true });
