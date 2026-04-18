export function pickDefined<T extends object>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (val !== undefined) {
                result[key] = val;
            }
        }
    }
    return result;
}

export function withDefault<T>(value: T | undefined, fallback: T): T {
    return value !== undefined ? value : fallback;
}

export function connectIfPresent(id: string | null | undefined) {
    if (id === undefined) return undefined;
    if (id === null) return undefined;
    return { connect: { id } };
}

export function connectOrDisconnect(id: string | null | undefined) {
    if (id === undefined) return undefined;
    if (id === null) return { disconnect: true };
    return { connect: { id } };
}
