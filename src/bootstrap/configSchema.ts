import Joi from 'joi';

const base64Key32 = Joi.string().custom((value, helpers) => {
    return Buffer.from(value, 'base64').length === 32 ? value : helpers.error('any.invalid');
}, '32-byte base64 key');

const common = {
    NODE_ENV: Joi.string().valid('production', 'staging', 'development').required(),
    DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
    REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
    JWT_SECRET: Joi.string().min(32).required(),
    TWO_FACTOR_ENC_KEY: base64Key32.required(),
};

// Operational config (email, telegram, storage, URLs, limits) lives in the system_settings table;
// only what is needed to boot and reach the DB/Redis is validated here.

const schemas = {
    api: Joi.object({
        ...common,
        CORS_ORIGIN: Joi.string().required(),
    }).unknown(true),
    worker: Joi.object(common).unknown(true),
};

export function validateConfig(processName: 'api' | 'worker', values: Record<string, string | undefined>) {
    const { error, value } = schemas[processName].validate(values, { abortEarly: false });
    // Only variable names and rule types — never values.
    const problems = [
        ...(error?.details.map((d) => `${d.path.join('.')} (${d.type})`) ?? []),
    ];
    if (problems.length > 0) {
        throw new Error(`Invalid configuration: ${problems.join(', ')}`);
    }
    return value as Record<string, string>;
}
