import Joi from 'joi';

export const addLocationDtoRequestSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    state: Joi.string().valid(
        'Amazonas', 'Anzoategui', 'Apure', 'Aragua', 'Barinas', 'Bolivar', 'Carabobo', 'Cojedes',
        'Delta_Amacuro', 'Distrito_Capital', 'Falcon', 'Guarico', 'Lara', 'Merida', 'Miranda', 'Monagas',
        'Nueva_Esparta', 'Portuguesa', 'Sucre', 'Tachira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
    ).required(),
    city: Joi.string().max(100).required(),
    tax_address: Joi.string().allow(null, ''),
    national_coverage: Joi.boolean().default(false),
    is_main_headquarters: Joi.boolean().default(false)
});

export const locationDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    company_id: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    tax_address: Joi.string().allow(null),
    national_coverage: Joi.boolean().required(),
    is_main_headquarters: Joi.boolean().required()
}).options({ stripUnknown: true });
