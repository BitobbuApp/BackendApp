import Joi from 'joi';

export const submitDocumentDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    type_id: Joi.number().integer().min(1).required(),
    file_url: Joi.string().uri().required()
});

export const verificationDtoResponseSchema = Joi.object({
    company_id: Joi.string().required(),
    status: Joi.string().required(),
    last_submission_at: Joi.date().allow(null),
    verified_at: Joi.date().allow(null),
    rejected_at: Joi.date().allow(null),
    rejection_reason: Joi.string().allow(null)
}).options({ stripUnknown: true });

export const documentDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    type_id: Joi.number().integer().required(),
    type: Joi.string().optional(),
    url: Joi.string().required(),
    status: Joi.string().required(),
    feedback: Joi.string().allow(null).optional(),
    notes: Joi.string().allow(null).optional(),
    created_at: Joi.date().required()
}).options({ stripUnknown: true });
