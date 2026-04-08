import Joi from 'joi';

export const getDashboardStatsDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required()
});

export const getDashboardStatsDtoResponseSchema = Joi.object({
    buyer_stats: Joi.object({
        generated_requests: Joi.number().required(),
        received_quotes: Joi.number().required(),
        generated_purchases: Joi.number().required(),
        estimated_savings: Joi.number().required()
    }).required(),
    supplier_stats: Joi.object({
        received_requests: Joi.number().required(),
        created_quotes: Joi.number().required(),
        generated_sales: Joi.number().required(),
        generated_revenue: Joi.number().required()
    }).required()
});
