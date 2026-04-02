import Joi from "joi";

// --- Request Schemas ---

export const createRequestDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().allow(null).optional(),
    product_service: Joi.string().max(200).required(),
    quantity: Joi.number().precision(2).positive().required(),
    unit_id: Joi.number().integer().min(1).default(1),
    description: Joi.string().allow(null, '').optional(),
    category_id: Joi.number().integer().min(1).allow(null).optional(),
    status: Joi.string().valid(
        'Active', 'Paused', 'Expired', 'Completed', 'Expiring_Soon', 'Closed'
    ).default('Active'),
    expiration_date: Joi.date().iso().allow(null).optional(),
    files: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            file_name: Joi.string().allow(null, '').optional(),
        })
    ).optional()
});

export const updateRequestDtoRequestSchema = Joi.object({
    id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().allow(null).optional(),
    product_service: Joi.string().max(200).optional(),
    quantity: Joi.number().precision(2).positive().optional(),
    unit_id: Joi.number().integer().min(1).optional(),
    description: Joi.string().allow(null, '').optional(),
    category_id: Joi.number().integer().min(1).allow(null).optional(),
    status: Joi.string().valid(
        'Active', 'Paused', 'Expired', 'Completed', 'Expiring_Soon', 'Closed'
    ).optional(),
    expiration_date: Joi.date().iso().allow(null).optional(),
});

export const getRequestsByCompanyIdDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

// --- Response Schemas ---

export const requestDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    user_id: Joi.string().allow(null).optional(),
    product_service: Joi.string().required(),
    quantity: Joi.number().required(),
    unit_of_measure: Joi.string().required(),
    unit_id: Joi.number().integer().required(),
    description: Joi.string().allow(null).optional(),
    category: Joi.string().allow(null).optional(),
    category_id: Joi.number().integer().allow(null).optional(),
    status: Joi.string().required(),
    expiration_date: Joi.date().iso().allow(null).optional(),
    response_count: Joi.number().required(),
    files: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            request_id: Joi.string().required(),
            url: Joi.string().required(),
            file_name: Joi.string().allow(null).optional(),
            created_at: Joi.date().iso().allow(null).optional(),
        })
    ).optional(),
    created_at: Joi.date().iso().allow(null).optional(),
    updated_at: Joi.date().iso().allow(null).optional(),
}).options({ stripUnknown: true });

export const requestListDtoResponseSchema = Joi.object({
    data: Joi.array().items(requestDtoResponseSchema).required(),
    total: Joi.number().integer().min(0).required(),
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
}).options({ stripUnknown: true });

// --- Marketplace Response Schemas ---

export const marketplaceRequestDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    user_id: Joi.string().allow(null).optional(),
    product_service: Joi.string().required(),
    quantity: Joi.number().required(),
    unit_of_measure: Joi.string().required(),
    unit_id: Joi.number().integer().required(),
    description: Joi.string().allow(null).optional(),
    category: Joi.string().allow(null).optional(),
    category_id: Joi.number().integer().allow(null).optional(),
    status: Joi.string().required(),
    expiration_date: Joi.date().iso().allow(null).optional(),
    response_count: Joi.number().required(),
    files: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            request_id: Joi.string().required(),
            url: Joi.string().required(),
            file_name: Joi.string().allow(null).optional(),
            created_at: Joi.date().iso().allow(null).optional(),
        })
    ).optional(),
    company: Joi.object({
        id: Joi.string().required(),
        trade_name: Joi.string().required(),
        logo_url: Joi.string().allow(null).optional(),
        sector: Joi.string().allow(null).optional(),
        average_rating: Joi.number().allow(null).optional(),
    }).allow(null).optional(),
    created_at: Joi.date().iso().allow(null).optional(),
    updated_at: Joi.date().iso().allow(null).optional(),
}).options({ stripUnknown: true });

export const marketplaceRequestListDtoResponseSchema = Joi.object({
    data: Joi.array().items(marketplaceRequestDtoResponseSchema).required(),
    total: Joi.number().integer().min(0).required(),
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
}).options({ stripUnknown: true });
