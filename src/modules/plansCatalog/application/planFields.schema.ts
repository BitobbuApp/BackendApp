import Joi from "joi";

/** Shared plan fields for create/update. Limits: null = unlimited. */
export const planFields = {
    code: Joi.string().pattern(/^[a-z0-9_]+$/).max(30),
    name: Joi.string().max(100),
    name_es: Joi.string().allow('').max(50),
    price: Joi.number().min(0),
    billing_cycle: Joi.number().integer().min(1),
    max_quotes_per_month: Joi.number().integer().min(0).allow(null),
    max_active_offers: Joi.number().integer().min(0).allow(null),
    is_default: Joi.boolean(),
    sort_order: Joi.number().integer().min(0),
    is_active: Joi.boolean(),
};
