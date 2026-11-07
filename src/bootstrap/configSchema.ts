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
    S3_REGION: Joi.string().required(),
    S3_ENDPOINT: Joi.string().uri().required(),
    S3_ACCESS_KEY_ID: Joi.string().required(),
    S3_SECRET_ACCESS_KEY: Joi.string().required(),
    S3_BUCKET_NAME: Joi.string().required(),
    S3_PUBLIC_URL: Joi.string().uri().required(),
    FRONTEND_URL: Joi.string().uri().required(),
    EMAIL_ENABLED: Joi.string().valid('true', 'false').default('false'),
    EMAIL_FROM_ADDRESS: Joi.string().email(),
};

// Mirrors loadEmailConfig(): the code accepts these alternatives, so the schema must too.
const EMAIL_API_KEY_SOURCES = ['EMAIL_MAILGUN_API_KEY', 'MAILGUN_API_KEY', 'EMAIL_MAILGUN_SMTP_PASS'];
const EMAIL_DOMAIN_SOURCES = ['EMAIL_MAILGUN_DOMAIN', 'EMAIL_MAILGUN_SMTP_USER'];

function emailProblems(values: Record<string, string | undefined>): string[] {
    if (values.EMAIL_ENABLED !== 'true') return [];
    const problems: string[] = [];
    if (!EMAIL_API_KEY_SOURCES.some((k) => values[k])) problems.push(`one of ${EMAIL_API_KEY_SOURCES.join('/')} (any.required)`);
    if (!EMAIL_DOMAIN_SOURCES.some((k) => values[k])) problems.push(`one of ${EMAIL_DOMAIN_SOURCES.join('/')} (any.required)`);
    return problems;
}

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
        ...emailProblems(values),
    ];
    if (problems.length > 0) {
        throw new Error(`Invalid configuration: ${problems.join(', ')}`);
    }
    return value as Record<string, string>;
}
