import { redisConnection } from '../../infrastructure/redis';
import logger from '../../infrastructure/logger';

export interface RateLimitOptions {
    key: string;
    maxAttempts: number;
    windowSeconds: number;
    failClosed?: boolean; // If true, rejects request when Redis is unavailable (e.g. for TOTP / brute-force defenses)
}

export interface RateLimitResult {
    allowed: boolean;
    current: number;
    remaining: number;
    resetInSeconds: number;
}

const RATE_LIMIT_TIMEOUT_MS = 400;

export class RateLimiter {
    /**
     * Executes a promise with a hard timeout to avoid blocking request pipelines
     * if Redis connection hangs.
     */
    private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`Redis rate limit operation timed out after ${timeoutMs}ms`)), timeoutMs)
            ),
        ]);
    }

    /**
     * Atomically increments the attempt counter and returns whether the action is permitted.
     */
    static async consume(options: RateLimitOptions): Promise<RateLimitResult> {
        const { key, maxAttempts, windowSeconds, failClosed = false } = options;

        try {
            const op = async (): Promise<RateLimitResult> => {
                // INCR + TTL in one MULTI; the expiry is set below on the first hit
                const multi = redisConnection.multi();
                multi.incr(key);
                multi.ttl(key);
                const results = await multi.exec();

                if (!results || results.length < 2) {
                    throw new Error('Redis multi failed during rate limit check');
                }

                const [incrErr, currentVal] = results[0]!;
                const [ttlErr, ttlVal] = results[1]!;

                if (incrErr || ttlErr) {
                    throw incrErr || ttlErr;
                }

                const current = Number(currentVal);
                let resetInSeconds = Number(ttlVal);

                if (current === 1 || resetInSeconds === -1) {
                    // Set expiration on first hit or if key had no expiry
                    await redisConnection.expire(key, windowSeconds);
                    resetInSeconds = windowSeconds;
                }

                const allowed = current <= maxAttempts;
                const remaining = Math.max(0, maxAttempts - current);

                return {
                    allowed,
                    current,
                    remaining,
                    resetInSeconds: Math.max(0, resetInSeconds),
                };
            };

            return await this.withTimeout(op(), RATE_LIMIT_TIMEOUT_MS);
        } catch (error) {
            logger.warn({ err: error, key, failClosed }, 'Rate limiter Redis failure or timeout');

            if (failClosed) {
                return {
                    allowed: false,
                    current: maxAttempts,
                    remaining: 0,
                    resetInSeconds: windowSeconds,
                };
            }

            // Default fail-open for non-critical endpoints to keep user flow uninterrupted
            return {
                allowed: true,
                current: 0,
                remaining: maxAttempts,
                resetInSeconds: 0,
            };
        }
    }

    /**
     * Reads current usage without incrementing counter.
     */
    static async check(key: string, maxAttempts: number, failClosed = false): Promise<RateLimitResult> {
        try {
            const op = async (): Promise<RateLimitResult> => {
                const multi = redisConnection.multi();
                multi.get(key);
                multi.ttl(key);
                const results = await multi.exec();

                if (!results) {
                    return { allowed: true, current: 0, remaining: maxAttempts, resetInSeconds: 0 };
                }

                const current = Number(results[0]?.[1]) || 0;
                const resetInSeconds = Math.max(0, Number(results[1]?.[1]) || 0);

                return {
                    allowed: current < maxAttempts,
                    current,
                    remaining: Math.max(0, maxAttempts - current),
                    resetInSeconds,
                };
            };

            return await this.withTimeout(op(), RATE_LIMIT_TIMEOUT_MS);
        } catch (error) {
            logger.warn({ err: error, key, failClosed }, 'Rate limiter Redis failure or timeout');
            if (failClosed) return { allowed: false, current: maxAttempts, remaining: 0, resetInSeconds: 0 };
            return { allowed: true, current: 0, remaining: maxAttempts, resetInSeconds: 0 };
        }
    }

    /**
     * Resets a rate limit counter (e.g., after successful login or verified action).
     */
    static async reset(key: string): Promise<void> {
        try {
            await this.withTimeout(redisConnection.del(key), RATE_LIMIT_TIMEOUT_MS);
        } catch (error) {
            logger.warn({ err: error, key }, 'Failed to reset rate limit key in Redis');
        }
    }
}
