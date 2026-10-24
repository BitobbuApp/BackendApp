import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { TokenGenerator } from '../../../shared/application/services/tokenGenerator';
import { passwordSchema, validatePasswordContext } from '../../../shared/application/validation/password.schema';
import {
    ResetTokenInvalidError,
    TwoFactorRequiredError,
    TwoFactorInvalidError,
    TooManyRequestsError,
} from '../domain/errors/auth.errors';
import { RateLimiter } from '../../../shared/application/services/rateLimiter';
import { PasswordChangeService } from '../domain/services/passwordChange.service';
import { TwoFactorAttemptGuard } from '../domain/services/twoFactorAttemptGuard';
import { TwoFactorVerifier, TwoFactorCheck } from '../domain/services/twoFactorVerifier.service';
import { MailgunEmailAdapter } from '../../../shared/infrastructure/notifications/mailgunEmailAdapter';
import { EmailService } from '../../../shared/application/services/email.service';
import { ApplicationError } from '../../../shared/domain/error';

const MAX_TOKEN_ATTEMPTS = 5;

interface ResetPasswordWithTokenInput {
    token: string;
    new_password: string;
    confirm_password: string;
    totp_code?: string;
    recovery_code?: string;
    ip?: string;
    userAgent?: string;
}

interface ResetPasswordWithTokenOutput {
    success: boolean;
    message: string;
    two_factor_enrollment_required: boolean;
}

export class ResetPasswordWithTokenUseCase extends UseCase<ResetPasswordWithTokenInput, ResetPasswordWithTokenOutput> {
    protected inputSchema = Joi.object({
        token: Joi.string().required().trim(),
        new_password: passwordSchema,
        confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
            'any.only': 'Las contraseñas no coinciden.',
        }),
        totp_code: Joi.string().allow('', null).optional(),
        recovery_code: Joi.string().allow('', null).optional(),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });

    protected outputSchema = Joi.any();

    private readonly passwordChangeService: PasswordChangeService;
    private readonly twoFactorVerifier: TwoFactorVerifier;
    private readonly emailService: EmailService;

    constructor() {
        super();
        this.passwordChangeService = new PasswordChangeService();
        this.twoFactorVerifier = new TwoFactorVerifier();
        this.emailService = new MailgunEmailAdapter();
    }

    protected async implementation(payload: ResetPasswordWithTokenInput): Promise<ResetPasswordWithTokenOutput> {
        const { token, new_password, totp_code, recovery_code, ip, userAgent } = payload;
        const now = new Date();

        // 1. IP Rate Limiting: Max 20 reset attempts per 15 minutes
        if (ip) {
            const ipLimit = await RateLimiter.consume({
                key: `rl:reset:ip:${ip}`,
                maxAttempts: 20,
                windowSeconds: 900,
                failClosed: false,
            });
            if (!ipLimit.allowed) {
                throw new TooManyRequestsError();
            }
        }

        // 2. Lookup and validate token record
        const tokenHash = TokenGenerator.hashToken(token);
        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token_hash: tokenHash },
            include: {
                user: {
                    include: {
                        two_factor: true,
                        company: {
                            include: {
                                settings: true,
                            },
                        },
                    },
                },
            },
        });

        if (
            !tokenRecord ||
            tokenRecord.used_at !== null ||
            tokenRecord.invalidated_at !== null ||
            tokenRecord.expires_at <= now ||
            tokenRecord.failed_attempts >= MAX_TOKEN_ATTEMPTS
        ) {
            throw new ResetTokenInvalidError();
        }

        const user = tokenRecord.user;

        // Contextual validation against personal info
        const contextCheck = validatePasswordContext(new_password, {
            email: user.email,
            firstName: user.first_name,
        });
        if (!contextCheck.valid) {
            throw new ApplicationError(422, contextCheck.reason || 'Contraseña insegura', 'PASSWORD_POLICY_VIOLATION');
        }

        // 3. 2FA: verified here without writing anything; what it consumes is committed together with the password
        const is2FaEnabled = Boolean(user.two_factor?.enabled_at);
        let twoFactorCheck: TwoFactorCheck | null = null;
        if (is2FaEnabled) {
            // Failures of this user across login and every reset token (counted only when a code fails)
            if (await TwoFactorAttemptGuard.isBlocked(user.id)) {
                await prisma.passwordResetToken.update({ where: { id: tokenRecord.id }, data: { invalidated_at: now } });
                throw new TooManyRequestsError('Demasiados intentos fallidos de 2FA. Tu enlace ha sido cancelado por seguridad.');
            }

            const cleanTotp = totp_code?.trim();
            const cleanRecovery = recovery_code?.trim();
            if (!cleanTotp && !cleanRecovery) {
                throw new TwoFactorRequiredError();
            }

            // Spend an attempt atomically BEFORE checking, so parallel requests cannot guess without paying
            const spent = await prisma.passwordResetToken.update({
                where: { id: tokenRecord.id },
                data: { failed_attempts: { increment: 1 } },
                select: { failed_attempts: true },
            });
            if (spent.failed_attempts > MAX_TOKEN_ATTEMPTS) {
                throw new ResetTokenInvalidError();
            }

            twoFactorCheck = await this.twoFactorVerifier.verify(
                user.two_factor!,
                user.id,
                { totp: cleanTotp, recovery: cleanRecovery },
                (codeHash) => prisma.userRecoveryCode.findFirst({
                    where: { user_id: user.id, code_hash: codeHash, used_at: null },
                    select: { id: true },
                }),
            );

            if (!twoFactorCheck) {
                await TwoFactorAttemptGuard.registerFailure(user.id);
                if (spent.failed_attempts >= MAX_TOKEN_ATTEMPTS) {
                    await prisma.passwordResetToken.update({ where: { id: tokenRecord.id }, data: { invalidated_at: now } });
                }
                await prisma.securityEvent.create({
                    data: {
                        user_id: user.id,
                        company_id: user.company_id ?? null,
                        event_type: 'two_factor_failed',
                        ip: ip ?? null,
                        user_agent: userAgent ?? null,
                    },
                }).catch(() => null);

                if (spent.failed_attempts >= MAX_TOKEN_ATTEMPTS) {
                    throw new ResetTokenInvalidError('Se ha alcanzado el límite de intentos permitidos. El enlace ha sido invalidado.');
                }
                throw new TwoFactorInvalidError();
            }
        }

        // 4 + 5. History check first; then, in one transaction: consume the token, commit the 2FA use, change the password.
        // A password rejected by the history leaves the token, the TOTP step and the recovery code untouched.
        const { passwordChangedAt } = await this.passwordChangeService.changePassword({
            userId: user.id,
            newPassword: new_password,
            reason: 'password_reset_completed',
            ip,
            userAgent,
            companyId: user.company_id,
            beforeCommit: async (tx) => {
                const consumed = await tx.passwordResetToken.updateMany({
                    where: { id: tokenRecord.id, used_at: null, invalidated_at: null, expires_at: { gt: now } },
                    data: { used_at: now },
                });
                if (consumed.count !== 1) throw new ResetTokenInvalidError();
                if (twoFactorCheck) await this.twoFactorVerifier.commit(tx, user.id, twoFactorCheck, now);
            },
        });

        // 6. Send password_updated notification email asynchronously (fail-safe)
        this.emailService.sendTemplate({
            to: user.email,
            templateKey: 'password_updated',
            variables: {
                first_name: user.first_name,
                changed_at: passwordChangedAt.toISOString(),
                ip: ip || 'Desconocida',
            },
        }).catch(() => null);

        // Check if company requires 2FA but user does not have it enabled yet
        const companyRequires2Fa = Boolean(user.company?.settings?.two_factor_required);
        const twoFactorEnrollmentRequired = companyRequires2Fa && !is2FaEnabled;

        return {
            success: true,
            message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.',
            two_factor_enrollment_required: twoFactorEnrollmentRequired,
        };
    }
}
