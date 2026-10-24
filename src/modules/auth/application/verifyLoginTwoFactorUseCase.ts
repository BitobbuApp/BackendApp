import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { JwtService } from '../../../shared/application/services/jwtService';
import { TwoFactorVerifier } from '../domain/services/twoFactorVerifier.service';
import { TwoFactorAttemptGuard } from '../domain/services/twoFactorAttemptGuard';
import crypto from 'crypto';
import { TwoFactorInvalidError } from '../domain/errors/auth.errors';
import { ApplicationError } from '../../../shared/domain/error';
import { RateLimiter } from '../../../shared/application/services/rateLimiter';

const MAX_FAILURES_PER_MFA_TOKEN = 5;

interface VerifyLoginTwoFactorInput {
    mfa_token: string;
    code: string;
    ip?: string;
    userAgent?: string;
}

interface VerifyLoginTwoFactorOutput {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    token: string;
    has_company: boolean;
    company_id: string | null;
}

export class VerifyLoginTwoFactorUseCase extends UseCase<VerifyLoginTwoFactorInput, VerifyLoginTwoFactorOutput> {
    protected inputSchema = Joi.object({
        mfa_token: Joi.string().required().trim(),
        code: Joi.string().required().trim(),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });

    protected outputSchema = Joi.any();

    private readonly jwtService: JwtService;
    private readonly twoFactorVerifier: TwoFactorVerifier;

    constructor() {
        super();
        this.jwtService = new JwtService();
        this.twoFactorVerifier = new TwoFactorVerifier();
    }

    protected async implementation(payload: VerifyLoginTwoFactorInput): Promise<VerifyLoginTwoFactorOutput> {
        const { mfa_token, code, ip, userAgent } = payload;

        // 1. Validate MFA step token
        const decoded = this.jwtService.verifyStepToken(mfa_token, 'mfa');
        if (!decoded) {
            throw new ApplicationError(401, 'El código o la sesión de verificación ha expirado. Inicia sesión nuevamente.', 'MFA_TOKEN_INVALID');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { two_factor: true },
        });

        if (!user || !user.is_active || !user.two_factor?.enabled_at) {
            throw new ApplicationError(401, 'No se pudo completar la verificación 2FA.');
        }

        // 2. Limits: failures per mfa_token (so one challenge cannot be ground down) and per user across the platform
        const tokenKey = `rl:mfa:${crypto.createHash('sha256').update(mfa_token).digest('hex')}`;
        const tokenLimit = await RateLimiter.check(tokenKey, MAX_FAILURES_PER_MFA_TOKEN, true);
        if (!tokenLimit.allowed) {
            throw new ApplicationError(401, 'Demasiados intentos con esta verificación. Inicia sesión nuevamente.', 'MFA_TOKEN_INVALID');
        }
        await TwoFactorAttemptGuard.assertNotBlocked(user.id);

        // 3. Verify the code (TOTP or recovery code share one input) and commit its use atomically
        const now = new Date();
        const check = await this.twoFactorVerifier.verify(
            user.two_factor,
            user.id,
            { totp: code, recovery: code },
            (codeHash) => prisma.userRecoveryCode.findFirst({
                where: { user_id: user.id, code_hash: codeHash, used_at: null },
                select: { id: true },
            }),
        );

        let committed = false;
        if (check) {
            try {
                await prisma.$transaction((tx) => this.twoFactorVerifier.commit(tx, user.id, check, now));
                committed = true;
            } catch (error) {
                if (!(error instanceof TwoFactorInvalidError)) throw error;
            }
        }

        if (!committed) {
            await Promise.all([
                TwoFactorAttemptGuard.registerFailure(user.id),
                RateLimiter.consume({ key: tokenKey, maxAttempts: MAX_FAILURES_PER_MFA_TOKEN, windowSeconds: 300, failClosed: true }),
                prisma.securityEvent.create({
                    data: {
                        user_id: user.id,
                        company_id: user.company_id ?? null,
                        event_type: 'two_factor_failed',
                        ip: ip ?? null,
                        user_agent: userAgent ?? null,
                    },
                }).catch(() => null),
            ]);
            throw new TwoFactorInvalidError();
        }

        // Update last access timestamp
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { last_access: now },
        });

        // 4. Issue full session JWT token
        const token = this.jwtService.generateToken({
            userId: user.id,
            companyId: user.company_id ?? null,
            email: user.email,
            tv: updatedUser.token_version,
        });

        return {
            id: updatedUser.id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            email: updatedUser.email,
            is_active: updatedUser.is_active,
            token,
            has_company: !!updatedUser.company_id,
            company_id: updatedUser.company_id,
        };
    }
}
