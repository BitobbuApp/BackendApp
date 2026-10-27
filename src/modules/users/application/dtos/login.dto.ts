import Joi from 'joi';

export const loginUserDtoRequestSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    ip: Joi.string().allow('', null).optional(),
});

export const loginUserDtoResponseSchema = Joi.alternatives().try(
    Joi.object({
        id: Joi.string().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        is_active: Joi.boolean().required(),
        last_access: Joi.date().allow(null),
        token: Joi.string().required(),
        has_company: Joi.boolean().required(),
        company_id: Joi.string().uuid().allow(null).required(),
    }),
    Joi.object({
        mfa_required: Joi.boolean().valid(true).required(),
        mfa_token: Joi.string().required(),
    }),
    Joi.object({
        two_factor_enrollment_required: Joi.boolean().valid(true).required(),
        enrollment_token: Joi.string().required(),
    })
).options({ stripUnknown: true });
