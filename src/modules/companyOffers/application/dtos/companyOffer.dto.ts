// src/modules/companyOffers/application/dtos/companyOffer.dto.ts
import Joi from "joi";

// --- Sub Schemas ---
export const companyOfferPhotoDtoSchema = Joi.object({
    url: Joi.string().uri().required(),
    sort_order: Joi.number().integer().min(0).default(0)
});

// --- Request Schemas ---
export const createCompanyOfferDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    name: Joi.string().max(200).required(),
    description: Joi.string().allow(null, '').optional(),
    category_id: Joi.number().integer().min(1).allow(null).optional(),
    supplier_type_id: Joi.number().integer().min(1).allow(null).optional(),
    base_price_usd: Joi.number().precision(2).min(0).allow(null).optional(),
    unit_id: Joi.number().integer().min(1).allow(null).optional(),
    moq: Joi.number().integer().min(1).allow(null).optional(),
    std_delivery_time: Joi.string().max(100).allow(null, '').optional(),
    video_url: Joi.string().uri().allow(null, '').optional(),
    is_active: Joi.boolean().default(true),
    rating: Joi.number().precision(2).min(0).max(5).allow(null).optional(),
    photos: Joi.array().items(companyOfferPhotoDtoSchema).optional().default([])
});

export const updateCompanyOfferDtoRequestSchema = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().max(200).optional(),
    description: Joi.string().allow(null, '').optional(),
    category_id: Joi.number().integer().min(1).allow(null).optional(),
    supplier_type_id: Joi.number().integer().min(1).allow(null).optional(),
    base_price_usd: Joi.number().precision(2).min(0).allow(null).optional(),
    unit_id: Joi.number().integer().min(1).allow(null).optional(),
    moq: Joi.number().integer().min(1).allow(null).optional(),
    std_delivery_time: Joi.string().max(100).allow(null, '').optional(),
    video_url: Joi.string().uri().allow(null, '').optional(),
    is_active: Joi.boolean().optional(),
    rating: Joi.number().precision(2).min(0).max(5).allow(null).optional(),
    photos: Joi.array().items(companyOfferPhotoDtoSchema).optional()
});

// --- Response Schemas ---
export const companyOfferPhotoDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    offer_id: Joi.string().uuid().required(),
    url: Joi.string().required(),
    sort_order: Joi.number().required(),
    created_at: Joi.date().allow(null).optional()
}).options({ stripUnknown: true });

export const companyOfferDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().allow(null).optional(),
    category_id: Joi.number().integer().allow(null).optional(),
    category: Joi.string().allow(null).optional(),
    supplier_type_id: Joi.number().integer().allow(null).optional(),
    supplier_type: Joi.string().allow(null).optional(),
    base_price_usd: Joi.number().allow(null).optional(),
    unit_id: Joi.number().integer().allow(null).optional(),
    unit_of_measure: Joi.string().allow(null).optional(),
    moq: Joi.number().allow(null).optional(),
    std_delivery_time: Joi.string().allow(null).optional(),
    video_url: Joi.string().allow(null).optional(),
    is_active: Joi.boolean().required(),
    rating: Joi.number().allow(null).optional(),
    created_at: Joi.date().allow(null).optional(),
    updated_at: Joi.date().allow(null).optional(),
    photos: Joi.array().items(companyOfferPhotoDtoResponseSchema).optional().default([])
}).options({ stripUnknown: true });

export const companyOfferListDtoResponseSchema = Joi.array()
    .items(companyOfferDtoResponseSchema);
