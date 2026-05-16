import formData from 'form-data';
import Mailgun from 'mailgun.js';
import logger from '../logger';
import { EmailService } from '../../application/services/email.service';
import { EmailMessage } from '../../domain/notifications/emailMessage';
import { EmailConfig, loadEmailConfig } from '../config/emailConfig';
import { MAILGUN_TEMPLATES } from '../../constants/email/email.constants';

export class MailgunEmailAdapter implements EmailService {
    private client: any;
    private config: EmailConfig;

    constructor() {
        this.config = loadEmailConfig();

        if (this.config.enabled) {
            const mailgun = new Mailgun(formData);
            this.client = mailgun.client({
                username: 'api',
                key: this.config.mailgun.apiKey,
                // Uncomment the next line if you are using EU region
                // url: 'https://api.eu.mailgun.net'
            });
            logger.info('Mailgun JS API client initialized');
        } else {
            logger.info('Email service is disabled (EMAIL_ENABLED=false)');
        }
    }

    async sendTemplate(message: EmailMessage): Promise<void> {
        if (!this.config.enabled || !this.client) {
            logger.info({ message }, 'Email sending skipped (service disabled)');
            return;
        }

        const templateNameStr = MAILGUN_TEMPLATES[message.templateKey] || message.templateKey;
        if (!templateNameStr) {
            logger.warn({ templateKey: message.templateKey }, 'Email template name not configured for key');
            return;
        }

        try {
            const messageData: any = {
                from: `${this.config.fromName} <${this.config.fromAddress}>`,
                to: message.to,
                subject: message.subject || 'Bitobbu Notification',
                template: templateNameStr,
            };

            if (message.variables) {
                // Pass template variables directly mapped for mailgun natively
                // mailgun.js expects variables as an object or stringified. The Mailgun API requires strings formatted as `v:my_var` or 't:variables' depending on implementation, but using the natively supported `t:variables` is standard.
                messageData['t:variables'] = JSON.stringify(message.variables);
            }

            const response = await this.client.messages.create(this.config.mailgun.domain, messageData);

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
            }, 'Failed to send template email (safe fail)');
        }
    }
}
