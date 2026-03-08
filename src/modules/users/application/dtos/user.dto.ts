import Joi from 'joi';

export const updateUserDtoRequestSchema = Joi.object({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    email: Joi.string().email().optional(),
    company_id: Joi.string().uuid().optional(),
}).min(1);

export const updateUserDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().required(),
    company_id: Joi.string().allow(null),
    created_at: Joi.date().required(),
    updated_at: Joi.date().allow(null)
}).options({ stripUnknown: true });
