import Joi from "joi";

const categorySchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    slug: Joi.string().required(),
    icon: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

const companyTypeSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    description: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

const notificationTypeSchema = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
    icon: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

const paymentMethodSchema = Joi.object({
    id: Joi.number().integer().required(),
    name_en: Joi.string().required(),
    name_es: Joi.string().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

const unitOfMeasureSchema = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
    abbreviation: Joi.string().required(),
}).options({ stripUnknown: true });

const verifDocTypeSchema = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
    instructions: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

const paymentConditionSchema = Joi.object({
    id: Joi.string().required(),
    name_es: Joi.string().required(),
    name_en: Joi.string().required(),
    days_to_due: Joi.number().integer().required(),
    description: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

const estimatedMonthlyTransactionSchema = Joi.object({
    id: Joi.string().required(),
    range_name: Joi.string().required(),
    description: Joi.string().allow(null, "").optional(),
    description_es: Joi.string().allow(null, "").optional(),
}).options({ stripUnknown: true });

const companySizeSchema = Joi.object({
    id: Joi.string().required(),
    size_name: Joi.string().required(),
    display_label: Joi.string().required(),
    display_label_es: Joi.string().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listAppMetaDataDtoResponseSchema = Joi.object({
    categories: Joi.array().items(categorySchema).required(),
    company_types: Joi.array().items(companyTypeSchema).required(),
    notification_types: Joi.array().items(notificationTypeSchema).required(),
    payment_methods: Joi.array().items(paymentMethodSchema).required(),
    units_of_measure: Joi.array().items(unitOfMeasureSchema).required(),
    verif_doc_types: Joi.array().items(verifDocTypeSchema).required(),
    payment_conditions: Joi.array().items(paymentConditionSchema).required(),
    estimated_monthly_transactions: Joi.array().items(estimatedMonthlyTransactionSchema).required(),
    company_sizes: Joi.array().items(companySizeSchema).required(),
}).options({ stripUnknown: true });
