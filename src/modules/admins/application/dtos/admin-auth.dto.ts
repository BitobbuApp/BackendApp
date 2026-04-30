import Joi from 'joi';

export const adminLoginDtoSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const adminLoginResponseSchema = Joi.object({
    token: Joi.string().required(),
    admin: Joi.object({
        id: Joi.string().uuid().required(),
        email: Joi.string().email().required(),
        full_name: Joi.string().required(),
        role: Joi.string().required(),
        status: Joi.string().required()
    }).required()
});

export const adminMeResponseSchema = Joi.object({
    admin: Joi.object({
        id: Joi.string().uuid().required(),
        email: Joi.string().email().required(),
        full_name: Joi.string().required(),
        role: Joi.string().required(),
        status: Joi.string().required()
    }).required()
});
