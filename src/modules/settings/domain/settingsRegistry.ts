export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export interface SettingDefinition {
    key: string;
    group: 'email' | 'telegram' | 'storage' | 'app' | 'limits' | 'features';
    type: SettingType;
    default?: unknown;
    secret?: boolean;
    /** Safe to expose through the unauthenticated /metadata/settings endpoint. */
    public?: boolean;
    description?: string;
}

const def = (d: SettingDefinition) => d;

export const SETTINGS_REGISTRY: SettingDefinition[] = [
    // email
    def({ key: 'email.enabled', group: 'email', type: 'boolean', default: false, description: 'Habilita el envío de correos' }),
    def({ key: 'email.from_address', group: 'email', type: 'string', default: 'no-reply@bitobbu.com' }),
    def({ key: 'email.from_name', group: 'email', type: 'string', default: 'Bitobbu' }),
    def({ key: 'email.mailgun.api_key', group: 'email', type: 'string', secret: true }),
    def({ key: 'email.mailgun.domain', group: 'email', type: 'string' }),
    def({ key: 'email.template.welcome', group: 'email', type: 'string', default: '' }),
    def({ key: 'email.template.password_reset', group: 'email', type: 'string', default: '' }),
    def({ key: 'email.template.verification', group: 'email', type: 'string', default: '' }),
    // telegram
    def({ key: 'telegram.alerts_enabled', group: 'telegram', type: 'boolean', default: false }),
    def({ key: 'telegram.bot_token', group: 'telegram', type: 'string', secret: true }),
    def({ key: 'telegram.chat_id', group: 'telegram', type: 'string' }),
    def({ key: 'telegram.min_level', group: 'telegram', type: 'string', default: 'error', description: 'error | critical' }),
    def({ key: 'telegram.environments', group: 'telegram', type: 'json', default: [], description: 'Lista de entornos que envían alertas' }),
    // storage
    def({ key: 'storage.s3.region', group: 'storage', type: 'string' }),
    def({ key: 'storage.s3.endpoint', group: 'storage', type: 'string' }),
    def({ key: 'storage.s3.bucket', group: 'storage', type: 'string' }),
    def({ key: 'storage.s3.access_key_id', group: 'storage', type: 'string', secret: true }),
    def({ key: 'storage.s3.secret_access_key', group: 'storage', type: 'string', secret: true }),
    def({ key: 'storage.public_url', group: 'storage', type: 'string', public: true }),
    // app
    def({ key: 'app.frontend_url', group: 'app', type: 'string' }),
    def({ key: 'app.totp_issuer', group: 'app', type: 'string', default: 'Bitobbu' }),
    def({ key: 'app.password_reset_ttl_minutes', group: 'app', type: 'number', default: 20 }),
    def({ key: 'app.bcrypt_cost', group: 'app', type: 'number', default: 12 }),
    def({ key: 'app.log_level', group: 'app', type: 'string', default: 'info' }),
    // limits
    def({ key: 'limits.login_max_per_email_ip', group: 'limits', type: 'number', default: 5 }),
    def({ key: 'limits.login_max_per_ip', group: 'limits', type: 'number', default: 30 }),
    def({ key: 'limits.max_2fa_failures_per_hour', group: 'limits', type: 'number', default: 10 }),
    def({ key: 'limits.max_failures_per_mfa_token', group: 'limits', type: 'number', default: 5 }),
    def({ key: 'limits.reset_token_max_attempts', group: 'limits', type: 'number', default: 5 }),
    def({ key: 'limits.upload_max_bytes', group: 'limits', type: 'number', default: 5 * 1024 * 1024 }),
    def({ key: 'limits.jwt_session_ttl', group: 'limits', type: 'string', default: '1h' }),
    def({ key: 'limits.jwt_step_ttl', group: 'limits', type: 'string', default: '5m' }),
    // features
    def({ key: 'features.maintenance_mode', group: 'features', type: 'boolean', default: false, public: true, description: 'Muestra modo mantenimiento en los clientes' }),
];

export const REGISTRY_BY_KEY = new Map(SETTINGS_REGISTRY.map((d) => [d.key, d]));
