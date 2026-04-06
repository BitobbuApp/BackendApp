import Joi from "joi";

const onboardingStatusItemSchema = Joi.object({
    id: Joi.string().required(),
    user_id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
    module_name: Joi.string().required(),
    has_completed_tutorial: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const getOnboardingStatusDtoResponseSchema = Joi.array()
    .items(onboardingStatusItemSchema)
    .required()
    .options({ stripUnknown: true });

export const completeOnboardingDtoRequestSchema = Joi.object({
    module_name: Joi.string().min(1).max(100).required(),
    user_id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
});

export const completeOnboardingDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    user_id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
    module_name: Joi.string().required(),
    has_completed_tutorial: Joi.boolean().required(),
}).options({ stripUnknown: true });
