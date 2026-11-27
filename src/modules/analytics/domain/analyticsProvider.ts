import { AnalyticsEvent } from './analyticsEvent';

export interface AnalyticsProviderResult {
    provider: string;
    sent: boolean;
    skippedReason?: string;
    response?: unknown;
}

export interface IAnalyticsProvider {
    readonly name: string;
    isEnabled(): boolean;
    send(event: AnalyticsEvent): Promise<AnalyticsProviderResult>;
}

