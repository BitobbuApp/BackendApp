import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { RateLimiter } from '../../../shared/application/services/rateLimiter';
import { TokenGenerator } from '../../../shared/application/services/tokenGenerator';
import { notificationsQueue } from '../../../shared/infrastructure/queue/notifications/notifications.queue';
import logger from '../../../shared/infrastructure/logger';

interface RequestPasswordResetInput {
    email: string;
    ip?: string;
    userAgent?: string;
}

interface RequestPasswordResetOutput {
    success: boolean;
    message: string;
}

export class RequestPasswordResetUseCase extends UseCase<RequestPasswordResetInput, RequestPasswordResetOutput> {
    protected inputSchema = Joi.object({
        email: Joi.string().email().trim().lowercase().required(),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });

    protected outputSchema = Joi.any();

    protected async implementation(payload: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
        const { email, ip, userAgent } = payload;
        const normalizedEmail = email.trim().toLowerCase();
        const emailHash = TokenGenerator.hashToken(normalizedEmail);

        // 1. Rate Limiting via Redis
        // Max 3 requests per email per hour
        const emailRateLimit = await RateLimiter.consume({
            key: `rl:forgot:email:${emailHash}`,
            maxAttempts: 3,
            windowSeconds: 3600,
            failClosed: false,
        });

        // Max 10 requests per IP per hour (if IP available)
        let ipAllowed = true;
        if (ip) {
            const ipRateLimit = await RateLimiter.consume({
                key: `rl:forgot:ip:${ip}`,
                maxAttempts: 10,
                windowSeconds: 3600,
                failClosed: false,
            });
            ipAllowed = ipRateLimit.allowed;
        }

        // Constant response message (prevents user enumeration & timing leakage)
        const genericResponse: RequestPasswordResetOutput = {
            success: true,
            message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos momentos.',
        };

        if (!emailRateLimit.allowed || !ipAllowed) {
            logger.warn({ email: normalizedEmail, ip }, 'Rate limit exceeded on password reset request — suppressing email delivery');
            return genericResponse;
        }

        // 2. Enqueue background job to process the token generation and email dispatch asynchronously
        try {
            await notificationsQueue.add(
                'password-reset-email',
                {
                    email: normalizedEmail,
                    ip: ip ?? null,
                    userAgent: userAgent ?? null,
                },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 3000 },
                    removeOnComplete: true,
                }
            );
        } catch (queueError) {
            logger.error({ err: queueError, email: normalizedEmail }, 'Failed to enqueue password reset email job to BullMQ');
            // We still return the generic response to avoid leaking internal queue failures
        }

        return genericResponse;
    }
}
