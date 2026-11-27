import { FastifyRequest } from 'fastify';
import { AnalyticsBrowserIds } from '../../domain/analyticsEvent';

export interface RequestAnalyticsContext {
    eventId?: string | undefined;
    sourceUrl?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    browserIds?: AnalyticsBrowserIds | undefined;
}

function parseCookieHeader(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) return undefined;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const [k, ...rest] = part.trim().split('=');
        if (k === name) return decodeURIComponent(rest.join('='));
    }
    return undefined;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
}

/** Extracts provider-agnostic tracking context (dedup eventId, IP, UA, browser cookies) from a Fastify request. */
export function extractAnalyticsContext(request: FastifyRequest): RequestAnalyticsContext {
    const cookieHeader = firstHeader(request.headers.cookie);
    const fbp = firstHeader(request.headers['x-analytics-fbp']) || parseCookieHeader(cookieHeader, '_fbp');
    const fbc = firstHeader(request.headers['x-analytics-fbc']) || parseCookieHeader(cookieHeader, '_fbc');
    const browserIds: AnalyticsBrowserIds | undefined = (fbp || fbc) ? { ...(fbp && { fbp }), ...(fbc && { fbc }) } : undefined;

    return {
        eventId: firstHeader(request.headers['x-analytics-event-id']),
        sourceUrl: firstHeader(request.headers['x-analytics-source-url']) || firstHeader(request.headers.referer),
        ip: request.ip,
        userAgent: firstHeader(request.headers['user-agent']),
        browserIds,
    };
}
