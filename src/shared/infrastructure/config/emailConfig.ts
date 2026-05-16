import logger from '../logger';

export interface EmailConfig {
    enabled: boolean;
    fromAddress: string;
    fromName: string;
    mailgun: {
        apiKey: string;
        domain: string;
    };
    templates: Record<string, string>;
}

export function loadEmailConfig(): EmailConfig {
    const enabled = process.env.EMAIL_ENABLED === 'true';

    const config: EmailConfig = {
        enabled,
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@bitobbu.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Bitobbu',
        mailgun: {
            apiKey: process.env.EMAIL_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY || process.env.EMAIL_MAILGUN_SMTP_PASS || '',
            domain: process.env.EMAIL_MAILGUN_DOMAIN || process.env.EMAIL_MAILGUN_SMTP_USER?.split('@')[1] || '',
        },
        templates: {
            welcome: process.env.EMAIL_TEMPLATE_WELCOME || '',
            password_reset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET || '',
            verification: process.env.EMAIL_TEMPLATE_VERIFICATION || '',
        }
    };

    if (enabled) {
        const missingVars: string[] = [];
        if (!config.mailgun.apiKey) missingVars.push('EMAIL_MAILGUN_API_KEY');
        if (!config.mailgun.domain) missingVars.push('EMAIL_MAILGUN_DOMAIN');
        if (!config.fromAddress) missingVars.push('EMAIL_FROM_ADDRESS');

        if (missingVars.length > 0) {
            const errorMsg = `Email service is enabled but missing required environment variables: ${missingVars.join(', ')}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    return config;
}
