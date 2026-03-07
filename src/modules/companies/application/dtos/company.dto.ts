import Joi from 'joi';

export const createCompanyDtoRequestSchema = Joi.object({
    trade_name: Joi.string().max(200).required(),
    legal_name: Joi.string().max(200).allow(null, ''),
    tax_id: Joi.string().max(20).allow(null, ''),
    founding_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null),
    bio: Joi.string().allow(null, ''),
    logo_url: Joi.string().uri().allow(null, ''),
    sector: Joi.string().valid('Food', 'Hardware', 'Health', 'IT', 'Automotive', 'Packaging', 'Chemicals', 'Office', 'Textile', 'Logistics', 'Maintenance', 'Security', 'Marketing', 'Legal', 'HR').allow(null),
    company_type: Joi.string().valid('Manufacturer', 'Wholesaler', 'Distributor', 'Service_Provider', 'Retailer').allow(null),
    interest: Joi.string().valid('Buy', 'Sell', 'Both').default('Both'),
    approximate_volume: Joi.string().valid('Small', 'Medium', 'Large').default('Medium')
});

export const createCompanyDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    trade_name: Joi.string().required(),
    legal_name: Joi.string().allow(null),
    tax_id: Joi.string().allow(null),
    sector: Joi.string().allow(null),
    logo_url: Joi.string().allow(null),
    created_at: Joi.date().required()
}).options({ stripUnknown: true });

export const updateCompanyDtoRequestSchema = Joi.object({
    trade_name: Joi.string().max(200),
    legal_name: Joi.string().max(200).allow(null, ''),
    tax_id: Joi.string().max(20).allow(null, ''),
    founding_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null),
    bio: Joi.string().allow(null, ''),
    logo_url: Joi.string().uri().allow(null, ''),
    sector: Joi.string().valid('Food', 'Hardware', 'Health', 'IT', 'Automotive', 'Packaging', 'Chemicals', 'Office', 'Textile', 'Logistics', 'Maintenance', 'Security', 'Marketing', 'Legal', 'HR').allow(null),
    company_type: Joi.string().valid('Manufacturer', 'Wholesaler', 'Distributor', 'Service_Provider', 'Retailer').allow(null),
    interest: Joi.string().valid('Buy', 'Sell', 'Both'),
    approximate_volume: Joi.string().valid('Small', 'Medium', 'Large')
}).min(1);

export const listCompaniesDtoResponseSchema = Joi.array().items(createCompanyDtoResponseSchema);
