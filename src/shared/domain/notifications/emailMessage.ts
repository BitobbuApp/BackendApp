export interface EmailMessage {
    to: string;
    subject?: string;
    templateKey: string;
    variables?: Record<string, string | number | boolean>;
    metadata?: Record<string, string>;
    /** When true a delivery failure is thrown (so a queue can retry); otherwise it is logged and swallowed */
    critical?: boolean;
}
