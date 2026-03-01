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
        })
});