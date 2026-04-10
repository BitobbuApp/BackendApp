import Joi from "joi";
import { ResponseStatus } from "../../domain/entities/quote_response.entity";

// --- Request Schemas ---
export const createQuoteResponseDtoRequestSchema = Joi.object({
    request_id: Joi.string().uuid().required(),
    company_offer_id: Joi.string().uuid().allow(null).optional(),
    unit_price_usd: Joi.number().precision(2).min(0).required(),
    quantity: Joi.number().precision(2).min(0).required(),
    payment_condition_id: Joi.string().uuid().allow(null, '').optional(),
    delivery_method_id: Joi.string().uuid().allow(null, '').optional(),
    delivery_time: Joi.string().max(100).allow(null, '').optional(),
    notes: Joi.string().allow(null, '').optional(),
    has_guarantee: Joi.boolean().default(false).optional(),
    status: Joi.string().valid('pending', 'accepted', 'rejected', 'negotiating', 'expired').default('pending')
});

export const updateQuoteResponseDtoRequestSchema = Joi.object({
    id: Joi.string().uuid().required(),
    company_offer_id: Joi.string().uuid().allow(null).optional(),
    unit_price_usd: Joi.number().precision(2).min(0).optional(),
    quantity: Joi.number().precision(2).min(0).optional(),
    payment_condition_id: Joi.string().uuid().allow(null, '').optional(),
    delivery_method_id: Joi.string().uuid().allow(null, '').optional(),
    delivery_time: Joi.string().max(100).allow(null, '').optional(),
    notes: Joi.string().allow(null, '').optional(),
    has_guarantee: Joi.boolean().optional(),
    status: Joi.string().valid('pending', 'accepted', 'rejected', 'negotiating', 'expired').optional(),
    rejection_reason: Joi.string().allow(null, '').optional()
});

export const listQuoteResponsesDtoRequestSchema = Joi.object({
    supplier_id: Joi.string().uuid().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

// --- Response Schemas ---
export const quoteResponseDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    request_id: Joi.string().required(),
    supplier_id: Joi.string().required(),
    company_offer_id: Joi.string().allow(null).optional(),
    unit_price_usd: Joi.number().required(),
    quantity: Joi.number().required(),
    payment_condition_id: Joi.string().uuid().allow(null).optional(),
    delivery_method_id: Joi.string().uuid().allow(null).optional(),
    delivery_time: Joi.string().allow(null).optional(),
    notes: Joi.string().allow(null).optional(),
    has_guarantee: Joi.boolean().allow(null).optional().default(false),
    status: Joi.string().required(),
    rejection_reason: Joi.string().allow(null).optional(),
    total_amount_usd: Joi.number().required(),
    created_at: Joi.date().allow(null).optional(),
    updated_at: Joi.date().allow(null).optional()
}).options({ stripUnknown: true });

export const paginatedQuoteResponsesDtoResponseSchema = Joi.object({
    items: Joi.array().items(quoteResponseDtoResponseSchema),
    total: Joi.number().required(),
    page: Joi.number().required(),
    limit: Joi.number().required(),
    totalPages: Joi.number().required()
}).options({ stripUnknown: true });

// --- Enriched Response Schema (with joined relations) ---
const supplierSummarySchema = Joi.object({
    id: Joi.string().required(),
    trade_name: Joi.string().allow(null, '').optional(),
    bio: Joi.string().allow(null, '').optional(),
    logo_url: Joi.string().allow(null, '').optional(),
    company_type: Joi.string().allow(null, '').optional(),
    company_type_ref: Joi.any().optional(),
    sector: Joi.string().allow(null, '').optional(),
    sector_ref: Joi.any().optional(),
    sector_id: Joi.number().allow(null).optional(),
    average_rating: Joi.any().optional(),
    review_count: Joi.number().allow(null).optional(),
    locations: Joi.array().items(Joi.any()).optional(),
}).options({ stripUnknown: true });

const requestSummarySchema = Joi.object({
    id: Joi.string().required(),
    product_service: Joi.string().allow(null).optional(),
    status: Joi.string().allow(null).optional(),
}).options({ stripUnknown: true });

export const receivedQuoteResponseDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    request_id: Joi.string().required(),
    supplier_id: Joi.string().required(),
    unit_price_usd: Joi.number().required(),
    quantity: Joi.number().required(),
    total_amount_usd: Joi.number().required(),
    payment_condition_id: Joi.string().uuid().allow(null).optional(),
    delivery_method_id: Joi.string().uuid().allow(null).optional(),
    delivery_time: Joi.string().allow(null).optional(),
    notes: Joi.string().allow(null).optional(),
    has_guarantee: Joi.boolean().allow(null).optional().default(false),
    status: Joi.string().required(),
    created_at: Joi.date().allow(null).optional(),
    updated_at: Joi.date().allow(null).optional(),
    supplier: supplierSummarySchema.optional(),
    request: requestSummarySchema.optional(),
}).options({ stripUnknown: true });

export const paginatedReceivedQuoteResponsesDtoResponseSchema = Joi.object({
    items: Joi.array().items(receivedQuoteResponseDtoResponseSchema),
    total: Joi.number().required(),
    page: Joi.number().required(),
    limit: Joi.number().required(),
    totalPages: Joi.number().required()
}).options({ stripUnknown: true });
