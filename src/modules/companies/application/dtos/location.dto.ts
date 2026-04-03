import Joi from 'joi';

export const addLocationDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    country_id: Joi.number().integer().min(1).allow(null).optional(),
    state_id: Joi.number().integer().min(1).allow(null).optional(),
    city_id: Joi.number().integer().min(1).allow(null).optional(),
    tax_address: Joi.string().allow(null, ''),
    national_coverage: Joi.boolean().default(false),
    is_main_headquarters: Joi.boolean().default(false)
});

export const locationDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    country_id: Joi.number().integer().allow(null),
    state_id: Joi.number().integer().allow(null),
    city_id: Joi.number().integer().allow(null),
    tax_address: Joi.string().allow(null),
    national_coverage: Joi.boolean().required(),
    is_main_headquarters: Joi.boolean().required(),
    country: Joi.object({
        id: Joi.number().integer().required(),
        name: Joi.string().required(),
        iso_code: Joi.string().required(),
    }).optional(),
    state: Joi.object({
        id: Joi.number().integer().required(),
        name: Joi.string().required(),
        code: Joi.string().allow(null, ''),
    }).optional(),
    city: Joi.object({
        id: Joi.number().integer().required(),
        name: Joi.string().required(),
    }).optional(),
}).options({ stripUnknown: true });
