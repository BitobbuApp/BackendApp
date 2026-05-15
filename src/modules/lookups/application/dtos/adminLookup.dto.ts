import Joi from "joi";

export const adminLookupTableKeySchema = Joi.string().valid(
    'categories',
    'company_types',
    'payment_methods',
    'units_of_measure',
    'verif_doc_types',
    'estimated_monthly_transactions',
    'company_sizes',
    'payment_conditions',
    'payment_terms',
    'verification_statuses',
);

const adminLookupItemSchema = Joi.object({
    id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    code: Joi.string().required(),
    label: Joi.string().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const adminLookupListDtoResponseSchema = Joi.array()
    .items(adminLookupItemSchema)
    .required()
    .options({ stripUnknown: true });

export const adminLookupItemDtoResponseSchema = adminLookupItemSchema.required().options({ stripUnknown: true });

export const adminListLookupsInputSchema = Joi.object({
    tableKey: adminLookupTableKeySchema.required(),
});

export const adminCreateLookupInputSchema = Joi.object({
    tableKey: adminLookupTableKeySchema.required(),
    data: Joi.object({
        code: Joi.string().trim().required(),
        label: Joi.string().trim().required(),
        is_active: Joi.boolean().optional(),
    }).required(),
});

export const adminUpdateLookupInputSchema = Joi.object({
    tableKey: adminLookupTableKeySchema.required(),
    id: Joi.string().required(),
    data: Joi.object({
        code: Joi.string().trim().optional(),
        label: Joi.string().trim().optional(),
        is_active: Joi.boolean().optional(),
    }).min(1).required(),
});

export const adminUpdateLookupStatusInputSchema = Joi.object({
    tableKey: adminLookupTableKeySchema.required(),
    id: Joi.string().required(),
    is_active: Joi.boolean().required(),
});
