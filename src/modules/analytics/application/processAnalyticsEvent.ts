import logger from '../../../shared/infrastructure/logger';
import { AnalyticsEvent } from '../domain/analyticsEvent';
import { IAnalyticsProvider } from '../domain/analyticsProvider';
import { ANALYTICS_PROVIDERS } from '../infrastructure/providers/providerRegistry';

export class ProcessAnalyticsEventUseCase {
    constructor(private readonly providers: IAnalyticsProvider[] = ANALYTICS_PROVIDERS) {}

    async execute(event: AnalyticsEvent): Promise<void> {
        const active = this.providers.filter((p) => p.isEnabled());
        if (active.length === 0) return;

        const results = await Promise.allSettled(active.map((provider) => provider.send(event)));
        const errors: string[] = [];

        results.forEach((res, idx) => {
            const providerName = active[idx]?.name ?? 'unknown';
            if (res.status === 'rejected') {
                const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
                logger.error({ provider: providerName, eventName: event.name, eventId: event.eventId, err: msg }, '[analytics] Provider delivery failed');
                errors.push(`${providerName}: ${msg}`);
            } else if (res.value.sent) {
                logger.debug({ provider: providerName, eventName: event.name, eventId: event.eventId }, '[analytics] Event delivered');
            }
        });

        // Throw if any provider failed so BullMQ retries the job with exponential backoff.
        if (errors.length > 0) {
            throw new Error(`Analytics delivery errors: ${errors.join('; ')}`);
        }
    }
}
