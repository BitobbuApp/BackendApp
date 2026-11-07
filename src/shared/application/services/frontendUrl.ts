const DEV_FRONTEND_URL = 'http://localhost:5173';

/**
 * Public URL of the web app, used for the links inside emails.
 * In production a missing FRONTEND_URL is an error: falling back to localhost would send users links that never open.
 */
export function getFrontendUrl(): string {
    const configured = process.env.FRONTEND_URL?.trim();
    if (configured) return configured.replace(/\/+$/, '');
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FRONTEND_URL is required in production (public URL of the web app, used in emails).');
    }
    return DEV_FRONTEND_URL;
}
