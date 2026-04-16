export interface EmailMessage {
    to: string;
    subject?: string;
    templateKey: string;
    variables?: Record<string, string | number | boolean>;
    metadata?: Record<string, string>;
}
