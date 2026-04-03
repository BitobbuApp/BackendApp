import Joi from "joi";

export const registerUserDtoRequestSchema = Joi.object({
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(6)
        .max(100)
        .required()
        .messages({
            'string.min': 'La contraseña debe tener al menos 6 caracteres'
        }),
    // Company fields — required for registration
    trade_name: Joi.string().min(2).max(200).required(),
    founding_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    country_id: Joi.number().integer().min(1).required(),
    state_id: Joi.number().integer().min(1).required(),
}).options({
    stripUnknown: true
});

export const registerUserDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
}).options({
    stripUnknown: true
});
