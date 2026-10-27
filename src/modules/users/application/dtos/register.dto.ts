import Joi from "joi";

export const registerUserDtoRequestSchema = Joi.object({
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(8)
        .max(100)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#%*?&])[A-Za-z\d@$!#%*?&]{8,}$/)
        .required()
        .messages({
            'string.min': 'La contraseña debe tener al menos 8 caracteres',
            'string.pattern.base': 'La contraseña debe incluir mayúsculas, minúsculas, un número y un carácter especial (@$!#%*?&)'
        }),
    // Company fields — required for registration
    trade_name: Joi.string().min(2).max(200).required(),
    country_id: Joi.number().integer().min(1).required(),
    state_id: Joi.number().integer().min(1).required(),
    sector_id: Joi.number().integer().min(1).required(),
    can_buy: Joi.boolean().default(false),
    can_sell: Joi.boolean().default(false),
}).options({
    stripUnknown: true
});

export const registerUserDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    is_active: Joi.boolean().required(),
    last_access: Joi.date().allow(null),
    token: Joi.string().required(),
    has_company: Joi.boolean().required(),
    company_id: Joi.string().uuid().allow(null).required(),
}).options({
    stripUnknown: true
});
