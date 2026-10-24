import { RateLimiter } from '../../../../shared/application/services/rateLimiter';
import { TooManyRequestsError } from '../errors/auth.errors';

export const MAX_2FA_FAILURES_PER_HOUR = 10;
const WINDOW_SECONDS = 3600;

const keyFor = (userId: string) => `rl:totp:user:${userId}`;

/**
 * Failed 2FA codes per user, shared by login, password reset and every endpoint that asks for a code.
 * Only failures count; Redis trouble blocks (fail closed) because this is a brute-force defense.
 */
export const TwoFactorAttemptGuard = {
    async isBlocked(userId: string): Promise<boolean> {
        const result = await RateLimiter.check(keyFor(userId), MAX_2FA_FAILURES_PER_HOUR, true);
        return !result.allowed;
    },

    async assertNotBlocked(userId: string): Promise<void> {
        if (await this.isBlocked(userId)) {
            throw new TooManyRequestsError('Demasiados intentos fallidos de 2FA. Tu cuenta ha sido protegida temporalmente.');
        }
    },

    async registerFailure(userId: string): Promise<void> {
        await RateLimiter.consume({
            key: keyFor(userId),
            maxAttempts: MAX_2FA_FAILURES_PER_HOUR,
            windowSeconds: WINDOW_SECONDS,
            failClosed: true,
        });
    },
};
