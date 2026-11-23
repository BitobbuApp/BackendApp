import formData from 'form-data';
import Mailgun from 'mailgun.js';
import logger from '../logger';
import { EmailService } from '../../application/services/email.service';
import { EmailMessage } from '../../domain/notifications/emailMessage';
import { EmailConfig, loadEmailConfig, emailConfigProblems } from '../config/emailConfig';
import { MAILGUN_TEMPLATES, MAILGUN_SUBJECTS } from '../../constants/email/email.constants';

// Shared across every adapter instance: the client is rebuilt only when the API key changes.
let sharedClient: { apiKey: string; client: any } | null = null;

function getClient(config: EmailConfig): any {
    if (sharedClient?.apiKey === config.mailgun.apiKey) return sharedClient.client;
    const mailgun = new Mailgun(formData);
    const client = mailgun.client({
        username: 'api',
        key: config.mailgun.apiKey,
        // Uncomment the next line if you are using EU region
        // url: 'https://api.eu.mailgun.net'
    });
    sharedClient = { apiKey: config.mailgun.apiKey, client };
    logger.info('Mailgun JS API client initialized');
    return client;
}

export class MailgunEmailAdapter implements EmailService {
    /** Optional client override (used by tests); otherwise the shared, settings-driven client is used. */
    protected client?: any;

    async sendTemplate(message: EmailMessage): Promise<void> {
        // Read per send so changes made from the BackOffice apply without a restart.
        const config = loadEmailConfig();
        if (!config.enabled) {
            logger.info({ message }, 'Email sending skipped (service disabled)');
            return;
        }

        const missing = emailConfigProblems(config);
        if (missing.length) {
            const errorMsg = `Email service is enabled but missing settings: ${missing.join(', ')}`;
            logger.error(errorMsg);
            if (message.critical) throw new Error(errorMsg);
            return;
        }
        const client = this.client ?? getClient(config);

        const templateNameStr = MAILGUN_TEMPLATES[message.templateKey] || message.templateKey;
        if (!templateNameStr) {
            logger.warn({ templateKey: message.templateKey }, 'Email template name not configured for key');
            return;
        }

        try {
            const messageData: any = {
                from: `${config.fromName} <${config.fromAddress}>`,
                to: message.to,
                subject: message.subject ?? MAILGUN_SUBJECTS[message.templateKey] ?? 'Bitobbu',
                template: templateNameStr,
            };

            if (message.variables) {
                // Pass template variables directly mapped for mailgun natively
                // mailgun.js expects variables as an object or stringified. The Mailgun API requires strings formatted as `v:my_var` or 't:variables' depending on implementation, but using the natively supported `t:variables` is standard.
                messageData['t:variables'] = JSON.stringify(message.variables);
            }

            const response = await client.messages.create(config.mailgun.domain, messageData);

            logger.info({
                messageId: response.id || response.message,
                to: message.to,
                templateKey: message.templateKey,
                templateName: templateNameStr
            }, 'Template email sent successfully via Mailgun API');

        } catch (error: any) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                status: error.status,
                details: error.details || error.response?.body || error.response?.text,
                to: message.to,
                templateKey: message.templateKey
            }, message.critical ? 'Failed to send critical template email' : 'Failed to send template email (safe fail)');

            if (message.critical) throw error;
        }
    }
}
