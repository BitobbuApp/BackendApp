import Joi from 'joi';

export const addContactDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    full_name: Joi.string().max(200).required(),
    position: Joi.string().max(100).allow(null, ''),
    whatsapp: Joi.string().max(20).allow(null, ''),
    email: Joi.string().email().max(100).allow(null, ''),
    is_primary: Joi.boolean().default(false)
});

export const contactDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    full_name: Joi.string().required(),
    position: Joi.string().allow(null),
    whatsapp: Joi.string().allow(null),
    email: Joi.string().allow(null),
    is_primary: Joi.boolean().required()
}).options({ stripUnknown: true });
