import Joi from "joi";

// --- Request Schemas ---

export const createTransactionDtoRequestSchema = Joi.object({
    quote_response_id: Joi.string().uuid().required(),
    buyer_id: Joi.string().uuid().required(),
    supplier_id: Joi.string().uuid().required(),
    product_description: Joi.string().max(300).required(),
    unit_price_usd: Joi.number().precision(2).min(0).required(),
    quantity: Joi.number().precision(2).min(0).required(),
    total_amount_usd: Joi.number().precision(2).min(0).required(),
    payment_method_id: Joi.number().integer().min(1).allow(null).optional(),
    payment_condition_id: Joi.string().uuid().allow(null, '').optional(),
    delivery_time: Joi.string().max(100).allow(null, '').optional(),
    status: Joi.string().valid('in_process', 'completed', 'canceled', 'in_dispute').default('in_process'),
    estimated_delivery_date: Joi.date().allow(null).optional(),
    actual_delivery_date: Joi.date().allow(null).optional(),
    cancellation_reason: Joi.string().allow(null, '').optional(),
    buyer_confirmed: Joi.boolean().default(false),
    supplier_confirmed: Joi.boolean().default(false),
    buyer_confirmed_at: Joi.date().allow(null).optional(),
    supplier_confirmed_at: Joi.date().allow(null).optional(),
});

export const updateTransactionDtoRequestSchema = Joi.object({
    id: Joi.string().uuid().required(),
    product_description: Joi.string().max(300).optional(),
    unit_price_usd: Joi.number().precision(2).min(0).optional(),
    quantity: Joi.number().precision(2).min(0).optional(),
    total_amount_usd: Joi.number().precision(2).min(0).optional(),
    payment_method_id: Joi.number().integer().min(1).allow(null).optional(),
    payment_condition_id: Joi.string().uuid().allow(null, '').optional(),
    delivery_time: Joi.string().max(100).allow(null, '').optional(),
    status: Joi.string().valid('in_process', 'completed', 'canceled', 'in_dispute').optional(),
    estimated_delivery_date: Joi.date().allow(null).optional(),
    actual_delivery_date: Joi.date().allow(null).optional(),
    cancellation_reason: Joi.string().allow(null, '').optional(),
    buyer_confirmed: Joi.boolean().optional(),
    supplier_confirmed: Joi.boolean().optional(),
    buyer_confirmed_at: Joi.date().allow(null).optional(),
    supplier_confirmed_at: Joi.date().allow(null).optional(),
});

export const listTransactionsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

// --- Response Schemas ---

export const transactionDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    quote_response_id: Joi.string().uuid().required(),
    buyer_id: Joi.string().uuid().required(),
    supplier_id: Joi.string().uuid().required(),
    product_description: Joi.string().required(),
    unit_price_usd: Joi.number().required(),
    quantity: Joi.number().required(),
    total_amount_usd: Joi.number().required(),
    payment_method_id: Joi.number().integer().allow(null).optional(),
    payment_method: Joi.string().allow(null).optional(),
    payment_condition_id: Joi.string().uuid().allow(null).optional(),
    delivery_time: Joi.string().allow(null).optional(),
    status: Joi.string().required(),
    estimated_delivery_date: Joi.date().allow(null).optional(),
    actual_delivery_date: Joi.date().allow(null).optional(),
    cancellation_reason: Joi.string().allow(null).optional(),
    buyer_confirmed: Joi.boolean().required(),
    supplier_confirmed: Joi.boolean().required(),
    buyer_confirmed_at: Joi.date().allow(null).optional(),
    supplier_confirmed_at: Joi.date().allow(null).optional(),
    created_at: Joi.date().allow(null).optional(),
    updated_at: Joi.date().allow(null).optional()
}).options({ stripUnknown: true });

export const transactionListDtoResponseSchema = Joi.object({
    items: Joi.array().items(transactionDtoResponseSchema).required(),
    total: Joi.number().integer().required(),
    page: Joi.number().integer().required(),
    limit: Joi.number().integer().required(),
    totalPages: Joi.number().integer().required()
}).options({ stripUnknown: true });
