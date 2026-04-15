import * as Sentry from '@sentry/node';

export function initSentry() {
    const isEnabled = process.env.SENTRY_ENABLED === 'true';

    if (!isEnabled) {
        return;
    }

    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        throw new Error('SENTRY_DSN is required when SENTRY_ENABLED is true');
    }

    Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',
        release: process.env.SENTRY_RELEASE,
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0,
    });
}

export function captureException(error: unknown, context?: Record<string, any>) {
    const isEnabled = process.env.SENTRY_ENABLED === 'true';
    if (!isEnabled) return;

    Sentry.withScope((scope) => {
        if (context) {
            if (context.tags) {
                scope.setTags(context.tags);
            }
            if (context.user) {
                scope.setUser(context.user);
            }
            if (context.extra) {
                scope.setExtras(context.extra);
            }
        }
        Sentry.captureException(error);
    });
}

export function captureMessage(message: string, level?: Sentry.SeverityLevel) {
    const isEnabled = process.env.SENTRY_ENABLED === 'true';
    if (!isEnabled) return;

    Sentry.captureMessage(message, level);
}

export function setUserContext(user: Sentry.User | null) {
    const isEnabled = process.env.SENTRY_ENABLED === 'true';
    if (!isEnabled) return;

    Sentry.setUser(user);
}
