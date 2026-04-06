import Joi from "joi";

const companySizeSchema = Joi.object({
    id: Joi.string().required(),
    size_name: Joi.string().required(),
    display_label: Joi.string().required(),
    display_label_es: Joi.string().required(),
    is_active: Joi.boolean().required(),
}).options({ stripUnknown: true });

export const listCompanySizesDtoResponseSchema = Joi.array()
    .items(companySizeSchema)
    .required()
    .options({ stripUnknown: true });
