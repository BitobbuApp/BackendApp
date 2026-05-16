import { EmailMessage } from '../../domain/notifications/emailMessage';

export interface EmailService {
    sendTemplate(message: EmailMessage): Promise<void>;
    // Optional raw send if ever needed
    sendRaw?(to: string, subject: string, html: string): Promise<void>;
}
