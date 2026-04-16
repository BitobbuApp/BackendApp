import logger from '../logger';

export interface EmailConfig {
    enabled: boolean;
    fromAddress: string;
    fromName: string;
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    templates: Record<string, string>;
}

export function loadEmailConfig(): EmailConfig {
    const enabled = process.env.EMAIL_ENABLED === 'true';

    const config: EmailConfig = {
        enabled,
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@bitobbu.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Bitobbu',
        smtp: {
            host: process.env.EMAIL_BREVO_SMTP_HOST || '',
            port: parseInt(process.env.EMAIL_BREVO_SMTP_PORT || '587', 10),
            user: process.env.EMAIL_BREVO_SMTP_USER || '',
            pass: process.env.EMAIL_BREVO_SMTP_PASS || '',
        },
        templates: {
            welcome: process.env.EMAIL_TEMPLATE_WELCOME || '',
            password_reset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET || '',
            verification: process.env.EMAIL_TEMPLATE_VERIFICATION || '',
        }
    };

    if (enabled) {
        const missingVars: string[] = [];
        if (!config.smtp.host) missingVars.push('EMAIL_BREVO_SMTP_HOST');
        if (!config.smtp.user) missingVars.push('EMAIL_BREVO_SMTP_USER');
        if (!config.smtp.pass) missingVars.push('EMAIL_BREVO_SMTP_PASS');
        if (!config.fromAddress) missingVars.push('EMAIL_FROM_ADDRESS');

        if (missingVars.length > 0) {
            const errorMsg = `Email service is enabled but missing required environment variables: ${missingVars.join(', ')}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    return config;
}
