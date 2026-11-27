import { randomUUID } from 'crypto';
import { settings } from '../../settings/application/settingsService';
import { analyticsQueue } from '../../../shared/infrastructure/queue/analytics/analytics.queue';
import logger from '../../../shared/infrastructure/logger';
import {
    AnalyticsEvent,
    AnalyticsEventProperties,
    AnalyticsUserContext,
    CanonicalEventName,
} from '../domain/analyticsEvent';

export interface TrackEventInput {
    name: CanonicalEventName;
    eventId?: string | undefined;
    occurredAt?: number | undefined;
    sourceUrl?: string | undefined;
    user?: AnalyticsUserContext | undefined;
    properties?: AnalyticsEventProperties | undefined;
}

/**
 * Provider-agnostic analytics dispatcher.
 * Enqueues canonical events into BullMQ so HTTP responses are never blocked by third-party APIs.
 * Short-circuits immediately when `marketing.enabled` is false.
 */
export class AnalyticsDispatcher {
    async track(input: TrackEventInput): Promise<void> {
        if (!settings.isEnabled('marketing.enabled')) return;

        const event: AnalyticsEvent = {
            eventId: input.eventId || randomUUID(),
            name: input.name,
            occurredAt: input.occurredAt ?? Math.floor(Date.now() / 1000),
            sourceUrl: input.sourceUrl || settings.get<string>('app.frontend_url') || undefined,
            user: input.user,
            properties: input.properties,
        };

        try {
            await analyticsQueue.add(event.name, event, { jobId: `${event.name}-${event.eventId}` });
        } catch (err) {
            // Analytics failures must never break business flows.
            logger.error({ err, eventName: event.name, eventId: event.eventId }, '[analytics] Failed to enqueue event');
        }
    }
}

export const analyticsDispatcher = new AnalyticsDispatcher();
