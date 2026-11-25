import { createHash, randomUUID } from 'crypto';
import { settings } from '../../../settings/application/settingsService';
import logger from '../../../../shared/infrastructure/logger';
import { AnalyticsEvent, CanonicalEventName } from '../../domain/analyticsEvent';
import { AnalyticsProviderResult, IAnalyticsProvider } from '../../domain/analyticsProvider';

const META_EVENT_MAP: Record<CanonicalEventName, string> = {
    page_view: 'PageView',
    view_content: 'ViewContent',
    user_registered: 'CompleteRegistration',
    rfq_created: 'Lead',
    quote_submitted: 'SubmitApplication',
    subscription_payment_reported: 'InitiateCheckout',
    subscription_activated: 'Purchase',
};

export function hashSha256(value?: string): string | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    return createHash('sha256').update(normalized).digest('hex');
}

export function normalizePhoneForHash(phone?: string): string | undefined {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    return digits ? hashSha256(digits) : undefined;
}

export interface MetaCapiConfig {
    enabled: boolean;
    pixelId: string;
    accessToken: string;
    apiVersion: string;
    testEventCode: string;
}

export class MetaCapiProvider implements IAnalyticsProvider {
    readonly name = 'meta-capi';

    constructor(
        private readonly configLoader: () => MetaCapiConfig = () => ({
            enabled: settings.isEnabled('marketing.enabled') && settings.isEnabled('marketing.meta.enabled'),
            pixelId: (settings.get<string>('marketing.meta.pixel_id') || '').trim(),
            accessToken: (settings.get<string>('marketing.meta.access_token') || '').trim(),
            apiVersion: (settings.get<string>('marketing.meta.api_version') || 'v19.0').trim(),
            testEventCode: (settings.get<string>('marketing.meta.test_event_code') || '').trim(),
        }),
        private readonly httpFetch: typeof fetch = fetch,
    ) {}

    isEnabled(): boolean {
        const cfg = this.configLoader();
        return cfg.enabled && Boolean(cfg.pixelId) && Boolean(cfg.accessToken);
    }

    buildPayload(event: AnalyticsEvent, testEventCode?: string): { body: Record<string, unknown>; hasMatchData: boolean } {
        const user = event.user ?? {};
        const userData: Record<string, unknown> = {};

        const emailHash = hashSha256(user.email);
        const phoneHash = normalizePhoneForHash(user.phone);
        const fnHash = hashSha256(user.firstName);
        const lnHash = hashSha256(user.lastName);
        const externalIdHash = hashSha256(user.userId || user.companyId);

        if (emailHash) userData.em = [emailHash];
        if (phoneHash) userData.ph = [phoneHash];
        if (fnHash) userData.fn = [fnHash];
        if (lnHash) userData.ln = [lnHash];
        if (externalIdHash) userData.external_id = [externalIdHash];
        if (user.ip) userData.client_ip_address = user.ip;
        if (user.userAgent) userData.client_user_agent = user.userAgent;
        if (user.browserIds?.fbp) userData.fbp = user.browserIds.fbp;
        if (user.browserIds?.fbc) userData.fbc = user.browserIds.fbc;

        // Meta requires at least one customer match parameter (otherwise fails with subcode 2804050).
        const hasMatchData = Boolean(
            emailHash || phoneHash || externalIdHash || user.browserIds?.fbp || user.browserIds?.fbc || (user.ip && user.userAgent)
        );

        const customData: Record<string, unknown> = {};
        if (event.properties?.value !== undefined) customData.value = event.properties.value;
        if (event.properties?.currency) customData.currency = event.properties.currency;
        if (event.properties?.contentIds?.length) customData.content_ids = event.properties.contentIds;
        if (event.properties?.contentType) customData.content_type = event.properties.contentType;
        if (event.properties?.contentName) customData.content_name = event.properties.contentName;
        if (event.properties?.planCode) customData.plan_code = event.properties.planCode;

        const dataEntry: Record<string, unknown> = {
            event_name: META_EVENT_MAP[event.name] || event.name,
            event_time: event.occurredAt,
            event_id: event.eventId,
            action_source: 'website',
            user_data: userData,
        };

        if (event.sourceUrl) dataEntry.event_source_url = event.sourceUrl;
        if (Object.keys(customData).length > 0) dataEntry.custom_data = customData;

        const body: Record<string, unknown> = { data: [dataEntry] };
        if (testEventCode) body.test_event_code = testEventCode;

        return { body, hasMatchData };
    }

    async send(event: AnalyticsEvent): Promise<AnalyticsProviderResult> {
        const cfg = this.configLoader();
        if (!cfg.enabled || !cfg.pixelId || !cfg.accessToken) {
            return { provider: this.name, sent: false, skippedReason: 'disabled_or_unconfigured' };
        }

        const { body, hasMatchData } = this.buildPayload(event, cfg.testEventCode || undefined);
        if (!hasMatchData) {
            logger.warn({ eventName: event.name, eventId: event.eventId }, '[meta-capi] Skipped event: insufficient user_data');
            return { provider: this.name, sent: false, skippedReason: 'insufficient_user_data' };
        }

        const url = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.accessToken)}`;
        const response = await this.httpFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const responseBody = await response.json().catch(() => ({}));
        if (!response.ok) {
            const msg = (responseBody as any)?.error?.message || `HTTP ${response.status}`;
            throw new Error(`Meta CAPI error (${response.status}): ${msg}`);
        }

        return { provider: this.name, sent: true, response: responseBody };
    }

    /** Used by BackOffice "Probar" button; ignores enabled flags so admins can verify credentials before turning it on. */
    async sendTestEvent(): Promise<string> {
        const cfg = this.configLoader();
        if (!cfg.pixelId || !cfg.accessToken) {
            throw new Error('marketing.meta.pixel_id y marketing.meta.access_token son requeridos');
        }
        const frontendUrl = settings.get<string>('app.frontend_url') || 'https://bitobbu.app';
        const testEvent: AnalyticsEvent = {
            eventId: randomUUID(),
            name: 'page_view',
            occurredAt: Math.floor(Date.now() / 1000),
            sourceUrl: frontendUrl,
            user: {
                ip: '190.200.1.1',
                userAgent: 'Bitobbu-BackOffice-Test/1.0',
            },
        };
        const { body } = this.buildPayload(testEvent, cfg.testEventCode || undefined);
        const url = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.accessToken)}`;
        const response = await this.httpFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const responseBody: any = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(responseBody?.error?.error_user_msg || responseBody?.error?.message || `Meta respondió ${response.status}`);
        }
        return cfg.testEventCode
            ? `Evento de prueba recibido por Meta (events_received: ${responseBody?.events_received ?? 1}, test_event_code: ${cfg.testEventCode})`
            : `Evento de prueba recibido por Meta (events_received: ${responseBody?.events_received ?? 1})`;
    }
}

