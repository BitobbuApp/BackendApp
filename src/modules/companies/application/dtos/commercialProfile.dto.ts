import Joi from 'joi';

export const updateCommercialProfileDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    is_withholding_agent: Joi.boolean(),
    works_with_credit: Joi.boolean()
});

export const commercialProfileDtoResponseSchema = Joi.object({
    company_id: Joi.string().required(),
    is_withholding_agent: Joi.boolean().required(),
    works_with_credit: Joi.boolean().required()
}).options({ stripUnknown: true });
