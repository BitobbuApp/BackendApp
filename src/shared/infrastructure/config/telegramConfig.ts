import { settings } from '../../../modules/settings/application/settingsService';

export interface TelegramConfig {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    minLevel: 'error' | 'critical';
    environments: string[];
}

/** Reads the current Telegram settings (DB -> default). Never throws: a misconfigured alert channel must not break requests. */
export function parseTelegramConfig(): TelegramConfig {
    const botToken = settings.get<string>('telegram.bot_token');
    const chatId = settings.get<string>('telegram.chat_id');
    const rawEnvs = settings.get<unknown>('telegram.environments');
    const environments = Array.isArray(rawEnvs) ? rawEnvs.map((e) => String(e).trim()).filter(Boolean) : [];

    // Alerts need both credentials; enabling them without a token/chat is treated as disabled.
    const enabled = settings.isEnabled('telegram.alerts_enabled') && !!botToken && !!chatId;

    const config: TelegramConfig = {
        enabled,
        minLevel: settings.get<string>('telegram.min_level') === 'critical' ? 'critical' : 'error',
        environments,
    };
    if (botToken) config.botToken = botToken;
    if (chatId) config.chatId = chatId;
    return config;
}
