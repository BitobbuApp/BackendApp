import nodemailer from 'nodemailer';
import logger from '../logger';
import { EmailService } from '../../application/services/email.service';
import { EmailMessage } from '../../domain/notifications/emailMessage';
import { EmailConfig, loadEmailConfig } from '../config/emailConfig';

export class MailgunEmailAdapter implements EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private config: EmailConfig;

    constructor() {
        this.config = loadEmailConfig();

        if (this.config.enabled) {
            this.transporter = nodemailer.createTransport({
                host: this.config.smtp.host,
                port: this.config.smtp.port,
                secure: this.config.smtp.port === 465, // true for 465, false for other ports
                auth: {
                    user: this.config.smtp.user,
                    pass: this.config.smtp.pass,
                },
            });
            logger.info('Nodemailer Mailgun transport initialized');
        } else {
            logger.info('Email service is disabled (EMAIL_ENABLED=false)');
        }
    }

    async sendTemplate(message: EmailMessage): Promise<void> {
        if (!this.config.enabled || !this.transporter) {
            logger.info({ message }, 'Email sending skipped (service disabled)');
            return;
        }

        const templateNameStr = this.config.templates[message.templateKey];
        if (!templateNameStr) {
            logger.warn({ templateKey: message.templateKey }, 'Email template name not configured for key');
            return;
        }

        try {
            // Mailgun supports templates via custom headers in SMTP
            // Reference: https://documentation.mailgun.com/en/latest/user_manual.html#templates
            const mailOptions: any = {
                from: {
                    name: this.config.fromName,
                    address: this.config.fromAddress
                },
                to: message.to,
                subject: message.subject || 'Bitobbu Notification', // Optional fallback
                // Dummy text required by some strict SMTP parsers when HTML is absent, Mailgun overrides with template
                text: 'Loading template...',
                headers: {
                    'X-Mailgun-Template': templateNameStr
                }
            };

            if (message.variables) {
                // Mailgun variables must be a stringified JSON object
                mailOptions.headers['X-Mailgun-Variables'] = JSON.stringify(message.variables);
            }

            const info = await this.transporter.sendMail(mailOptions);

            logger.info({
                messageId: info.messageId,
                to: message.to,
                templateKey: message.templateKey,
                templateName: templateNameStr
            }, 'Template email sent successfully via Mailgun/Nodemailer');

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                to: message.to,
                templateKey: message.templateKey
            }, 'Failed to send template email (safe fail)');
        }
    }
}
