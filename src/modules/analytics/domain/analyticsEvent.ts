export type CanonicalEventName =
    | 'page_view'
    | 'view_content'
    | 'user_registered'
    | 'rfq_created'
    | 'quote_submitted'
    | 'subscription_payment_reported'
    | 'subscription_activated';

export interface AnalyticsBrowserIds {
    fbp?: string | undefined;
    fbc?: string | undefined;
}

export interface AnalyticsUserContext {
    userId?: string | undefined;
    companyId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    browserIds?: AnalyticsBrowserIds | undefined;
}

export interface AnalyticsEventProperties {
    value?: number | undefined;
    currency?: string | undefined;
    contentIds?: string[] | undefined;
    contentType?: string | undefined;
    contentName?: string | undefined;
    planCode?: string | undefined;
}

export interface AnalyticsEvent {
    /** UUID shared with the frontend pixel so providers (e.g. Meta) deduplicate browser + server events. */
    eventId: string;
    name: CanonicalEventName;
    /** Unix timestamp in seconds. */
    occurredAt: number;
    sourceUrl?: string | undefined;
    user?: AnalyticsUserContext | undefined;
    properties?: AnalyticsEventProperties | undefined;
}
