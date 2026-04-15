export interface TelegramConfig {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    minLevel: 'error' | 'critical';
    environments: string[];
}

export function parseTelegramConfig(): TelegramConfig {
    const enabled = process.env.TELEGRAM_ALERTS_ENABLED === 'true';

    if (enabled) {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            throw new Error('TELEGRAM_BOT_TOKEN is required when TELEGRAM_ALERTS_ENABLED is true');
        }
        if (!process.env.TELEGRAM_CHAT_ID) {
            throw new Error('TELEGRAM_CHAT_ID is required when TELEGRAM_ALERTS_ENABLED is true');
        }
    }

    const minLevel = (process.env.TELEGRAM_ALERT_MIN_LEVEL === 'critical') ? 'critical' : 'error';
    const environments = process.env.TELEGRAM_ALERT_ENVIRONMENTS
        ? process.env.TELEGRAM_ALERT_ENVIRONMENTS.split(',').map(e => e.trim()).filter(Boolean)
        : [];

    const config: TelegramConfig = {
        enabled,
        minLevel,
        environments
    };

    if (process.env.TELEGRAM_BOT_TOKEN) config.botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (process.env.TELEGRAM_CHAT_ID) config.chatId = process.env.TELEGRAM_CHAT_ID;

    return config;
}
