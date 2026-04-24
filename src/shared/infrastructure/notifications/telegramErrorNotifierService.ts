import { ErrorNotificationInput, ErrorNotifierService } from '../../application/services/errorNotifier.service';
import { TelegramConfig } from '../config/telegramConfig';
import logger from '../logger';

export class TelegramErrorNotifierService implements ErrorNotifierService {
    private config: TelegramConfig;
    private dedupeCache: Map<string, number>;
    private readonly DEDUPE_WINDOW_MS = 60 * 1000; // 60 seconds

    constructor(config: TelegramConfig) {
        this.config = config;
        this.dedupeCache = new Map<string, number>();
    }

    async notifyCriticalError(input: ErrorNotificationInput): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        // Check environment filters
        if (this.config.environments.length > 0 && !this.config.environments.includes(input.environment)) {
            return;
        }

        // Check level
        if (this.config.minLevel === 'critical' && input.severity !== 'critical') {
            return;
        }

        const now = Date.now();
        const minuteBucket = Math.floor(now / this.DEDUPE_WINDOW_MS);
        const fingerprint = `${input.errorName}:${input.route}:${minuteBucket}`;

        if (this.dedupeCache.has(fingerprint)) {
            // Already sent in this window
            return;
        }

        // Cleanup old cache entries (simple approach)
        if (this.dedupeCache.size > 1000) {
            this.dedupeCache.clear();
        }

        this.dedupeCache.set(fingerprint, now);

        const message = this.formatMessage(input);

        // Fire and forget
        this.sendToTelegram(message).catch(err => {
            logger.error({ err }, 'Failed to send Telegram error notification');
        });
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    private formatMessage(input: ErrorNotificationInput): string {
        const severityIcon = input.severity === 'critical' ? '🔴' : '🟠';
        let msg = `${severityIcon} <b>[${this.escapeHtml(input.app)} | ${this.escapeHtml(input.environment)}]</b> ${input.severity.toUpperCase()}\n\n`;

        msg += `<b>Route:</b> <code>${this.escapeHtml(input.method)} ${this.escapeHtml(input.route)}</code>\n`;
        msg += `<b>Error:</b> <code>${this.escapeHtml(input.errorName)}</code>\n`;

        const truncatedMsg = input.errorMessage.substring(0, 500);
        msg += `<b>Message:</b> ${this.escapeHtml(truncatedMsg)}\n\n`;

        if (input.requestId) {
            msg += `<b>Req ID:</b> <code>${this.escapeHtml(input.requestId)}</code>\n`;
        }

        if (input.userId) {
            msg += `<b>User ID:</b> <code>${this.escapeHtml(input.userId)}</code>\n`;
        }

        if (input.companyId) {
            msg += `<b>Company ID:</b> <code>${this.escapeHtml(input.companyId)}</code>\n`;
        }

        msg += `<b>Time:</b> ${this.escapeHtml(input.timestamp)}\n`;

        return msg;
    }

    private async sendToTelegram(message: string): Promise<void> {
        if (!this.config.botToken || !this.config.chatId) {
            return;
        }

        const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

        const payload = {
            chat_id: this.config.chatId,
            text: message,
            parse_mode: 'HTML'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`Telegram API responded with ${response.status}: ${responseText}`);
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
