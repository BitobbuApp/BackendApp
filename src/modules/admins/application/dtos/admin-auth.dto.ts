import Joi from 'joi';


export const createAdminDtoSchema = Joi.object({
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
    full_name: Joi.string().required(),
    role: Joi.string().required(),
    status: Joi.string().required(),
    permissions: Joi.array().items(Joi.string()).optional()
});

export const createAdminResponseSchema = Joi.object({
    admin: Joi.object({
        email: Joi.string().email().required(),
        full_name: Joi.string().required(),
        role: Joi.string().required(),
        status: Joi.string().required()
    }).required()
});

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

export const updateAdminDtoSchema = Joi.object({
    password: Joi.string()
        .min(8)
        .max(100)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#%*?&])[A-Za-z\d@$!#%*?&]{8,}$/)
        .optional()
        .messages({
            'string.min': 'La contraseña debe tener al menos 8 caracteres',
            'string.pattern.base': 'La contraseña debe incluir mayúsculas, minúsculas, un número y un carácter especial (@$!#%*?&)'
        }),
    full_name: Joi.string().optional(),
    role: Joi.string().valid('superadmin', 'ops_admin').optional(),
    status: Joi.string().valid('active', 'inactive', 'locked').optional()
});
