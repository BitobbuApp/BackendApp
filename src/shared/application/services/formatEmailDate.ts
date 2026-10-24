export const DEFAULT_EMAIL_TIMEZONE = 'America/Caracas';

/**
 * Date and time for the body of an email, in the user's language and time zone:
 * "24 de octubre de 2026, 4:26 p. m.". Falls back to Caracas time when the zone is missing or invalid.
 */
export function formatEmailDate(date: Date, timeZone?: string | null): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    try {
        return new Intl.DateTimeFormat('es', { ...options, timeZone: timeZone || DEFAULT_EMAIL_TIMEZONE }).format(date);
    } catch {
        return new Intl.DateTimeFormat('es', { ...options, timeZone: DEFAULT_EMAIL_TIMEZONE }).format(date);
    }
}
