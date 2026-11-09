export const DAY_MS = 24 * 60 * 60 * 1000;

/** Offset (ms) between UTC and the wall clock of `timeZone` at `date`. Positive east of UTC. */
function zoneOffsetMs(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** UTC instant of local midnight for the given calendar day in `timeZone`. */
export function zonedMidnight(year: number, monthIndex: number, day: number, timeZone: string): Date {
    const guess = new Date(Date.UTC(year, monthIndex, day));
    return new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
}

/** Calendar year/month (0-based) of `date` as seen in `timeZone`. */
function zonedYearMonth(date: Date, timeZone: string): { year: number; month: number } {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(date);
    return {
        year: Number(parts.find((p) => p.type === 'year')?.value),
        month: Number(parts.find((p) => p.type === 'month')?.value) - 1,
    };
}

/** [start, end) of the calendar month containing `now` in `timeZone`. Quotas reset at local midnight of the 1st. */
export function monthRange(now: Date, timeZone: string): { start: Date; end: Date } {
    const { year, month } = zonedYearMonth(now, timeZone);
    return {
        start: zonedMidnight(year, month, 1, timeZone),
        end: zonedMidnight(month === 11 ? year + 1 : year, (month + 1) % 12, 1, timeZone),
    };
}

/**
 * First instant after the business day `isoDate` (YYYY-MM-DD) ends in `timeZone`,
 * i.e. "hasta el 31/12" includes the whole 31st. Returns null for empty/invalid input.
 */
export function endOfZonedDay(isoDate: string | undefined, timeZone: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate ?? '');
    if (!m) return null;
    return zonedMidnight(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1, timeZone);
}
