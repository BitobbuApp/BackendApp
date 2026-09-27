// src/modules/companyOffers/application/dtos/companyOffer.dto.ts
import Joi from "joi";

// --- Sub Schemas ---
export const companyOfferPhotoDtoSchema = Joi.object({
    url: Joi.string().uri().required(),
    sort_order: Joi.number().integer().min(0).default(0)
});

export const companyOfferPricingTierDtoSchema = Joi.object({
    min_quantity: Joi.number().integer().min(1).required(),
    max_quantity: Joi.number().integer().min(1).allow(null).optional(),
    price_usd: Joi.number().precision(2).min(0).required()
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
    photos: Joi.array().items(companyOfferPhotoDtoSchema).optional().default([]),
    pricing_tiers: Joi.array().items(companyOfferPricingTierDtoSchema).optional().default([]),
    rawFiles: Joi.any().optional(),
    files: Joi.any().optional()
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
    photos: Joi.array().items(companyOfferPhotoDtoSchema).optional(),
    pricing_tiers: Joi.array().items(companyOfferPricingTierDtoSchema).optional()
});

// --- Response Schemas ---
export const companyOfferPhotoDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    offer_id: Joi.string().uuid().required(),
    url: Joi.string().required(),
    sort_order: Joi.number().required(),
    created_at: Joi.date().allow(null).optional()
}).options({ stripUnknown: true });

export const companyOfferCompanyLocationDtoResponseSchema = Joi.object({
    country_id: Joi.number().integer().allow(null).optional(),
    state_id: Joi.number().integer().allow(null).optional(),
    city_id: Joi.number().integer().allow(null).optional()
}).options({ stripUnknown: true });

export const companyOfferCompanyDetailsDtoResponseSchema = Joi.object({
    trade_name: Joi.string().allow('', null).required(),
    legal_name: Joi.string().allow('', null).optional(),
    logo_url: Joi.string().allow('', null).optional(),
    average_rating: Joi.number().allow(null).optional(),
    review_count: Joi.number().allow(null).optional(),
    locations: Joi.array().items(companyOfferCompanyLocationDtoResponseSchema).optional().default([]),
    recent_reviews: Joi.array().items(
        Joi.object({
            id: Joi.string().uuid().optional(),
            rating: Joi.number().optional(),
            comment: Joi.string().allow('', null).optional(),
            created_at: Joi.date().allow(null).optional(),
            author_name: Joi.string().allow('', null).optional()
        }).options({ stripUnknown: true })
    ).optional().default([])
}).options({ stripUnknown: true });

export const companyOfferPricingTierDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    offer_id: Joi.string().uuid().required(),
    min_quantity: Joi.number().integer().required(),
    max_quantity: Joi.number().integer().allow(null).optional(),
    price_usd: Joi.number().required(),
    created_at: Joi.date().allow(null).optional()
}).options({ stripUnknown: true });
export const companyOfferDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
    name: Joi.string().allow('', null).required(),
    description: Joi.string().allow('', null).optional(),
    category_id: Joi.number().integer().allow(null).optional(),
    category: Joi.string().allow('', null).optional(),
    supplier_type_id: Joi.number().integer().allow(null).optional(),
    supplier_type: Joi.string().allow('', null).optional(),
    base_price_usd: Joi.number().allow(null).optional(),
    unit_id: Joi.number().integer().allow(null).optional(),
    unit_of_measure: Joi.string().allow('', null).optional(),
    moq: Joi.number().allow(null).optional(),
    std_delivery_time: Joi.string().allow('', null).optional(),
    video_url: Joi.string().allow('', null).optional(),
    is_active: Joi.boolean().required(),
    rating: Joi.number().allow(null).optional(),
    deleted_at: Joi.date().allow(null).optional(),
    created_at: Joi.date().allow(null).optional(),
    updated_at: Joi.date().allow(null).optional(),
    photos: Joi.array().items(companyOfferPhotoDtoResponseSchema).optional().default([]),
    company_details: companyOfferCompanyDetailsDtoResponseSchema.allow(null).optional(),
    pricing_tiers: Joi.array().items(companyOfferPricingTierDtoResponseSchema).optional().default([])
}).options({ stripUnknown: true });

export const searchMarketplaceDtoRequestSchema = Joi.object({
    searchTerm: Joi.string().allow('', null).optional(),
    categoryId: Joi.number().integer().min(1).allow(null).optional(),
    supplierTypeId: Joi.number().integer().min(1).allow(null).optional(),
    minPrice: Joi.number().min(0).allow(null).optional(),
    maxPrice: Joi.number().min(0).allow(null).optional(),
    countryId: Joi.number().integer().min(1).allow(null).optional(),
    stateId: Joi.number().integer().min(1).allow(null).optional(),
    sortBy: Joi.string().valid('price_asc', 'price_desc', 'rating_desc', 'newest').default('newest'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

export const companyOfferListDtoResponseSchema = Joi.array()
    .items(companyOfferDtoResponseSchema);
