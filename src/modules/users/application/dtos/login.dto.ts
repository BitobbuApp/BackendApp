import Joi from 'joi';

export const loginUserDtoRequestSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const loginUserDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    is_active: Joi.boolean().required(),
    last_access: Joi.date().allow(null),
    token: Joi.string().required(),
}).options({ stripUnknown: true });
