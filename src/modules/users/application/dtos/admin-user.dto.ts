import Joi from 'joi';

export const adminListUsersInputSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    company_id: Joi.string().uuid().optional(),
});

export const adminListUsersResponseSchema = Joi.object({
    items: Joi.array().items(Joi.object({
        id: Joi.string().uuid().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        full_name: Joi.string().required(),
        email: Joi.string().email().required(),
        company_id: Joi.string().uuid().allow(null).required(),
        company_name: Joi.string().allow(null, '').required(),
        status: Joi.string().required(),
        verification_status: Joi.string().allow(null).required(),
        created_at: Joi.date().required()
    })).required(),
    page: Joi.number().required(),
    limit: Joi.number().required(),
    total: Joi.number().required(),
    total_pages: Joi.number().required()
});

export const adminUpdateUserStatusInputSchema = Joi.object({
    id: Joi.string().uuid().required(),
    status: Joi.string().valid('active', 'inactive').required(),
    reason: Joi.string().optional()
});

export const adminUpdateUserStatusResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    status: Joi.string().required()
});
