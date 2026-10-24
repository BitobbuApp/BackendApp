import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { TotpService } from '../../../shared/application/services/totpService';
import { EncryptionService } from '../../../shared/application/services/encryptionService';
import { TwoFactorInvalidError } from '../domain/errors/auth.errors';
import { ApplicationError } from '../../../shared/domain/error';
import { JwtService } from '../../../shared/application/services/jwtService';
import { TwoFactorAttemptGuard } from '../domain/services/twoFactorAttemptGuard';

interface EnableTwoFactorInput {
    userId: string;
    code: string;
    ip?: string;
    userAgent?: string;
}

interface EnableTwoFactorOutput {
    success: boolean;
    recovery_codes: string[];
    /** Fresh session: enabling 2FA bumps token_version, and an enrollment-token user has no session yet */
    session: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        is_active: boolean;
        token: string;
        has_company: boolean;
        company_id: string | null;
    };
}

export class EnableTwoFactorUseCase extends UseCase<EnableTwoFactorInput, EnableTwoFactorOutput> {
    protected inputSchema = Joi.object({
        userId: Joi.string().uuid().required(),
        code: Joi.string().pattern(/^\d{6}$/).required().messages({
            'string.pattern.base': 'El código de verificación debe ser de 6 dígitos numéricos.',
        }),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });

    protected outputSchema = Joi.any();

    private readonly totpService: TotpService;
    private readonly encryptionService: EncryptionService;

    constructor() {
        super();
        this.totpService = new TotpService();
        this.encryptionService = new EncryptionService();
    }

    protected async implementation(payload: EnableTwoFactorInput): Promise<EnableTwoFactorOutput> {
        const { userId, code, ip, userAgent } = payload;

        await TwoFactorAttemptGuard.assertNotBlocked(userId);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { two_factor: true },
        });

        if (!user || !user.two_factor) {
            throw new ApplicationError(400, 'Primero debes iniciar la configuración de 2FA.');
        }

        if (user.two_factor.enabled_at) {
            throw new ApplicationError(409, 'La autenticación en dos factores ya se encuentra activada.');
        }

        // Decrypt secret and verify code
        const secretBase32 = this.encryptionService.decrypt(
            user.two_factor.secret_ciphertext,
            user.two_factor.secret_iv,
            user.two_factor.secret_tag,
            user.two_factor.key_version
        );

        const verifyResult = this.totpService.verifyTotp(code, secretBase32);
        if (!verifyResult.valid || !verifyResult.step) {
            await TwoFactorAttemptGuard.registerFailure(userId);
            throw new TwoFactorInvalidError();
        }

        // Generate 10 single-use recovery codes
        const { rawCodes, hashedCodes } = this.totpService.generateRecoveryCodes();
        const now = new Date();

        const updatedUser = await prisma.$transaction(async (tx) => {
            // Activate 2FA
            await tx.userTwoFactor.update({
                where: { user_id: userId },
                data: {
                    enabled_at: now,
                    last_used_step: verifyResult.step!,
                },
            });

            // Refresh user session token_version
            const bumped = await tx.user.update({
                where: { id: userId },
                data: { token_version: { increment: 1 } },
            });

            // Store recovery codes
            await tx.userRecoveryCode.deleteMany({ where: { user_id: userId } });
            await tx.userRecoveryCode.createMany({
                data: hashedCodes.map((codeHash) => ({
                    user_id: userId,
                    code_hash: codeHash,
                    created_at: now,
                })),
            });

            // Log security audit event
            await tx.securityEvent.create({
                data: {
                    user_id: userId,
                    company_id: user.company_id ?? null,
                    event_type: 'two_factor_enrolled',
                    ip: ip ?? null,
                    user_agent: userAgent ?? null,
                },
            });

            return bumped;
        });

        const token = new JwtService().generateToken({
            userId: updatedUser.id,
            companyId: updatedUser.company_id ?? null,
            email: updatedUser.email,
            tv: updatedUser.token_version,
        });

        return {
            success: true,
            recovery_codes: rawCodes,
            session: {
                id: updatedUser.id,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                is_active: updatedUser.is_active,
                token,
                has_company: !!updatedUser.company_id,
                company_id: updatedUser.company_id,
            },
        };
    }
}
