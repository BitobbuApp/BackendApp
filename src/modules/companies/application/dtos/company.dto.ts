import Joi from 'joi';

export const createCompanyDtoRequestSchema = Joi.object({
    trade_name: Joi.string().max(200).required(),
    legal_name: Joi.string().max(200).allow(null, '').optional(),
    tax_id: Joi.string().max(20).allow(null, '').optional(),
    founding_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null).optional(),
    bio: Joi.string().allow(null, '').optional(),
    logo_url: Joi.string().allow(null, '').uri().optional(),
    sector: Joi.string().valid('Alimentos', 'Ferretería', 'Salud', 'IT', 'Automotriz', 'Embalaje', 'Químicos', 'Oficina', 'Textil', 'Logística', 'Mantenimiento', 'Seguridad', 'Marketing', 'Legal', 'RRHH').allow(null, '').optional(),
    company_type: Joi.string().valid('Fabricante', 'Mayorista', 'Distribuidor', 'Prestador de Servicios', 'Minorista').allow(null, '').optional(),
    interest: Joi.string().valid('Comprar', 'Vender', 'Ambos').default('Ambos'),
    approximate_volume: Joi.string().valid('Pequeño', 'Medio', 'Grande').default('Medio'),

    // Flat mapping for Locations
    location_state: Joi.string().allow(null, '').optional(),
    location_city: Joi.string().max(100).allow(null, '').optional(),
    tax_address: Joi.string().allow(null, '').optional(),
    national_coverage: Joi.boolean().default(false),

    // Flat mapping for Contacts
    contact_person: Joi.string().max(200).allow(null, '').optional(),
    contact_role: Joi.string().max(100).allow(null, '').optional(),
    whatsapp: Joi.string().max(20).allow(null, '').optional(),
    corporate_email: Joi.string().allow(null, '').email().optional(),

    // Flat mapping for Commercial Profile
    retention_agent: Joi.boolean().default(false),
    works_with_credit: Joi.boolean().default(false),

    // Flat mapping for Settings
    email_notifications: Joi.boolean().default(true),
    web_notifications: Joi.boolean().default(true),
    whatsapp_notifications: Joi.boolean().default(false),

    // Arrays
    payment_methods: Joi.array().items(Joi.string().valid(
        'Transferencia',
        'Efectivo',
        'Tarjeta de Crédito',
        'Tarjeta de Débito',
        'Criptomoneda',
        'Pago Móvil',
        'Zelle'
    )).default([]),
    interest_categories: Joi.array().items(Joi.string()).default([]),
    creatorId: Joi.string().uuid().optional()
});

export const createCompanyDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    trade_name: Joi.string().required(),
    legal_name: Joi.string().allow(null, ''),
    tax_id: Joi.string().allow(null, ''),
    sector: Joi.string().allow(null, ''),
    logo_url: Joi.string().allow(null, ''),
    created_at: Joi.date().required()
}).options({ stripUnknown: true });

export const updateCompanyDtoRequestSchema = Joi.object({
    trade_name: Joi.string().max(200),
    legal_name: Joi.string().max(200).allow(null, '').optional(),
    tax_id: Joi.string().max(20).allow(null, '').optional(),
    founding_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null).optional(),
    bio: Joi.string().allow(null, '').optional(),
    logo_url: Joi.string().allow(null, '').uri().optional(),
    sector: Joi.string().valid('Alimentos', 'Ferretería', 'Salud', 'IT', 'Automotriz', 'Embalaje', 'Químicos', 'Oficina', 'Textil', 'Logística', 'Mantenimiento', 'Seguridad', 'Marketing', 'Legal', 'RRHH').allow(null, '').optional(),
    company_type: Joi.string().valid('Fabricante', 'Mayorista', 'Distribuidor', 'Prestador de Servicios', 'Minorista').allow(null, '').optional(),
    interest: Joi.string().valid('Comprar', 'Vender', 'Ambos'),
    approximate_volume: Joi.string().valid('Pequeño', 'Medio', 'Grande'),

    // Flat mapping for Locations
    location_state: Joi.string().allow(null, '').optional(),
    location_city: Joi.string().max(100).allow(null, '').optional(),
    tax_address: Joi.string().allow(null, '').optional(),
    national_coverage: Joi.boolean(),

    // Flat mapping for Contacts
    contact_person: Joi.string().max(200).allow(null, '').optional(),
    contact_role: Joi.string().max(100).allow(null, '').optional(),
    whatsapp: Joi.string().max(20).allow(null, '').optional(),
    corporate_email: Joi.string().allow(null, '').email().optional(),

    // Flat mapping for Commercial Profile
    retention_agent: Joi.boolean(),
    works_with_credit: Joi.boolean(),

    // Flat mapping for Settings
    email_notifications: Joi.boolean(),
    web_notifications: Joi.boolean(),
    whatsapp_notifications: Joi.boolean(),

    // Arrays
    payment_methods: Joi.array().items(Joi.string().valid(
        'Transferencia',
        'Efectivo',
        'Tarjeta de Crédito',
        'Tarjeta de Débito',
        'Criptomoneda',
        'Pago Móvil',
        'Zelle'
    )),
    interest_categories: Joi.array().items(Joi.string())
}).min(1);

const companyWithRelationsSchema = Joi.object({
    id: Joi.string().required(),
    trade_name: Joi.string().required(),
    legal_name: Joi.string().allow(null, ''),
    tax_id: Joi.string().allow(null, ''),
    sector: Joi.string().allow(null, ''),
    company_type: Joi.string().allow(null, ''),
    interest: Joi.string().allow(null, ''),
    approximate_volume: Joi.string().allow(null, ''),
    logo_url: Joi.string().allow(null, ''),
    bio: Joi.string().allow(null, ''),
    founding_year: Joi.number().allow(null),
    average_rating: Joi.number().allow(null),
    transaction_count: Joi.number(),
    review_count: Joi.number(),
    locations: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        location_state: Joi.string().allow(null, ''),
        location_city: Joi.string().allow(null, ''),
        tax_address: Joi.string().allow(null, ''),
        national_coverage: Joi.boolean(),
        is_main_headquarters: Joi.boolean(),
    })).optional(),
    contacts: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        contact_person: Joi.string().allow(null, ''),
        position: Joi.string().allow(null, ''),
        whatsapp: Joi.string().allow(null, ''),
        corporate_email: Joi.string().allow(null, ''),
        is_primary: Joi.boolean(),
    })).optional(),
    commercial_profile: Joi.object({
        retention_agent: Joi.boolean(),
        works_with_credit: Joi.boolean(),
    }).allow(null).optional(),
    settings: Joi.object({
        email_notifications: Joi.boolean(),
        web_notifications: Joi.boolean(),
    }).allow(null).optional(),
    payment_methods: Joi.array().items(Joi.string()).optional(),
    categories_of_interest: Joi.array().items(Joi.string()).optional(),
    created_at: Joi.date().required(),
    updated_at: Joi.date().allow(null),
}).options({ stripUnknown: true });

export const listCompaniesDtoResponseSchema = Joi.object({
    data: Joi.array().items(companyWithRelationsSchema).required(),
    total: Joi.number().integer().min(0).required(),
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
}).options({ stripUnknown: true });
