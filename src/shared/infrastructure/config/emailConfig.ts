import { settings } from '../../../modules/settings/application/settingsService';

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

/** Reads the current email settings (DB -> default). Cheap: backed by the in-memory cache. */
export function loadEmailConfig(): EmailConfig {
    const str = (key: string) => settings.get<string>(key) ?? '';

    return {
        enabled: settings.isEnabled('email.enabled'),
        fromAddress: str('email.from_address'),
        fromName: str('email.from_name'),
        mailgun: {
            apiKey: str('email.mailgun.api_key'),
            domain: str('email.mailgun.domain'),
        },
        templates: {
            welcome: str('email.template.welcome'),
            password_reset: str('email.template.password_reset'),
            verification: str('email.template.verification'),
        },
    };
}

/** Names of the settings that are required but empty while email is enabled. */
export function emailConfigProblems(config: EmailConfig): string[] {
    if (!config.enabled) return [];
    const missing: string[] = [];
    if (!config.mailgun.apiKey) missing.push('email.mailgun.api_key');
    if (!config.mailgun.domain) missing.push('email.mailgun.domain');
    if (!config.fromAddress) missing.push('email.from_address');
    return missing;
}
