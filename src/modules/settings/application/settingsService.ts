import { prisma } from '../../../shared/infrastructure/database';
import { redisConnection } from '../../../shared/infrastructure/redis';
import logger from '../../../shared/infrastructure/logger';
import { REGISTRY_BY_KEY, SETTINGS_REGISTRY, SettingDefinition } from '../domain/settingsRegistry';

const CHANNEL = 'settings:changed';
const REFRESH_MS = 60_000;

type Listener = (changedKeys: string[]) => void;

function coerce(def: SettingDefinition, raw: unknown): unknown {
    if (raw === undefined || raw === null) return undefined;
    switch (def.type) {
        case 'boolean':
            return typeof raw === 'boolean' ? raw : String(raw).toLowerCase() === 'true';
        case 'number': {
            const n = Number(raw);
            return Number.isFinite(n) ? n : undefined;
        }
        case 'json':
            if (typeof raw !== 'string') return raw;
            try { return JSON.parse(raw); } catch { return raw.split(',').map((s) => s.trim()).filter(Boolean); }
        default:
            return String(raw);
    }
}

export function validateSettingValue(def: SettingDefinition, value: unknown): unknown {
    const v = coerce(def, value);
    if (v === undefined) throw new Error(`Invalid value for ${def.key}: expected ${def.type}`);
    return v;
}

export function maskSecret(value: unknown): string | null {
    if (value === undefined || value === null || value === '') return null;
    const s = String(value);
    return `••••${s.slice(-4)}`;
}

/**
 * Process-local cache of DB settings. Resolution order: DB value -> registry default (env is no longer consulted).
 * Reads are synchronous so consumers can call get() per use instead of freezing config at import time.
 * Other processes (PM2 api instances, worker) are notified through a Redis channel.
 */
export class SettingsService {
    private cache = new Map<string, unknown>();
    private listeners = new Set<Listener>();
    private version = 0;
    private timer?: NodeJS.Timeout;
    private started = false;

    /** Loads the cache and starts cross-process invalidation. Call after connectDatabase()/connectRedis(). */
    async init(): Promise<void> {
        await this.reload();
        this.applyLogLevel();
        this.onChange((keys) => { if (keys.includes('app.log_level')) this.applyLogLevel(); });
        if (this.started) return;
        this.started = true;
        try {
            const sub = redisConnection.duplicate();
            await sub.subscribe(CHANNEL);
            sub.on('message', () => { this.reload().catch((e) => logger.error(e, 'settings reload failed')); });
        } catch (error) {
            logger.error(error, 'settings pub/sub unavailable, relying on periodic refresh');
        }
        this.timer = setInterval(() => { this.reload().catch((e) => logger.error(e, 'settings refresh failed')); }, REFRESH_MS);
        this.timer.unref();
    }

    private applyLogLevel(): void {
        const level = this.get<string>('app.log_level');
        if (level && level !== logger.level) logger.level = level;
    }

    async reload(): Promise<void> {
        const rows = await prisma.systemSetting.findMany({ select: { key: true, value: true } });
        const next = new Map<string, unknown>();
        for (const row of rows) {
            const def = REGISTRY_BY_KEY.get(row.key);
            if (!def) continue;
            const v = coerce(def, row.value);
            // null means "not defined" and falls back to the registry default; empty string is a deliberate value.
            if (v !== undefined) next.set(row.key, v);
        }
        const changed: string[] = [];
        for (const key of new Set([...this.cache.keys(), ...next.keys()])) {
            if (JSON.stringify(this.cache.get(key)) !== JSON.stringify(next.get(key))) changed.push(key);
        }
        this.cache = next;
        if (changed.length) {
            this.version++;
            this.listeners.forEach((l) => { try { l(changed); } catch (e) { logger.error(e, 'settings listener failed'); } });
        }
    }

    get<T = unknown>(key: string): T | undefined {
        const def = REGISTRY_BY_KEY.get(key);
        if (!def) throw new Error(`Unknown setting: ${key}`);
        if (this.cache.has(key)) return this.cache.get(key) as T;
        return def.default as T | undefined;
    }

    isEnabled(key: string): boolean {
        return this.get<boolean>(key) === true;
    }

    /** Monotonic counter bumped on every observed change; clients use it to know when to rebuild. */
    getVersion(): number {
        return this.version;
    }

    onChange(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    async set(key: string, value: unknown, adminId?: string): Promise<void> {
        const def = REGISTRY_BY_KEY.get(key);
        if (!def) throw new Error(`Unknown setting: ${key}`);
        const v = validateSettingValue(def, value);
        await prisma.systemSetting.upsert({
            where: { key },
            create: {
                key, group: def.group, value: v as any, value_type: def.type,
                is_secret: !!def.secret, description: def.description ?? null,
                updated_by_admin_id: adminId ?? null,
            },
            update: { value: v as any, updated_by_admin_id: adminId ?? null, updated_at: new Date() },
        });
        await this.reload();
        try { await redisConnection.publish(CHANNEL, key); } catch (e) { logger.error(e, 'settings publish failed'); }
    }

    /** Admin view: effective values, secrets masked. */
    list(group?: string) {
        return SETTINGS_REGISTRY
            .filter((d) => !group || d.group === group)
            .map((d) => {
                const value = this.get(d.key);
                return {
                    key: d.key, group: d.group, type: d.type, is_secret: !!d.secret,
                    description: d.description ?? null,
                    value: d.secret ? maskSecret(value) : value ?? null,
                    source: this.cache.has(d.key) ? 'db' : 'default',
                };
            });
    }
}

export const settings = new SettingsService();
