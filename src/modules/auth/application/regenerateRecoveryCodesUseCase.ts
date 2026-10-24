import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { EncryptionService } from '../../../shared/application/services/encryptionService';
import { TotpService } from '../../../shared/application/services/totpService';
import { TwoFactorInvalidError } from '../domain/errors/auth.errors';
import { ApplicationError } from '../../../shared/domain/error';
import { TwoFactorAttemptGuard } from '../domain/services/twoFactorAttemptGuard';

interface RegenerateRecoveryCodesInput {
    userId: string;
    code: string;
    ip?: string;
    userAgent?: string;
}

interface RegenerateRecoveryCodesOutput {
    recovery_codes: string[];
}

export class RegenerateRecoveryCodesUseCase extends UseCase<RegenerateRecoveryCodesInput, RegenerateRecoveryCodesOutput> {
    protected inputSchema = Joi.object({
        userId: Joi.string().uuid().required(),
        code: Joi.string().required().trim(),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });

    protected outputSchema = Joi.any();

    private readonly encryptionService: EncryptionService;
    private readonly totpService: TotpService;

    constructor() {
        super();
        this.encryptionService = new EncryptionService();
        this.totpService = new TotpService();
    }

    protected async implementation(payload: RegenerateRecoveryCodesInput): Promise<RegenerateRecoveryCodesOutput> {
        const { userId, code, ip, userAgent } = payload;

        await TwoFactorAttemptGuard.assertNotBlocked(userId);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { two_factor: true },
        });

        if (!user || !user.two_factor?.enabled_at) {
            throw new ApplicationError(400, 'La autenticación en dos factores no está activa.');
        }

        const secretBase32 = this.encryptionService.decrypt(
            user.two_factor.secret_ciphertext,
            user.two_factor.secret_iv,
            user.two_factor.secret_tag,
            user.two_factor.key_version
        );

        const verifyTotp = this.totpService.verifyTotp(code, secretBase32, user.two_factor.last_used_step);
        if (!verifyTotp.valid || !verifyTotp.step) {
            await TwoFactorAttemptGuard.registerFailure(userId);
            throw new TwoFactorInvalidError();
        }

        const { rawCodes, hashedCodes } = this.totpService.generateRecoveryCodes();
        const now = new Date();

        await prisma.$transaction(async (tx) => {
            await tx.userTwoFactor.update({
                where: { user_id: userId },
                data: { last_used_step: verifyTotp.step! },
            });

            await tx.userRecoveryCode.deleteMany({ where: { user_id: userId } });
            await tx.userRecoveryCode.createMany({
                data: hashedCodes.map((codeHash) => ({
                    user_id: userId,
                    code_hash: codeHash,
                    created_at: now,
                })),
            });

            await tx.securityEvent.create({
                data: {
                    user_id: userId,
                    company_id: user.company_id ?? null,
                    event_type: 'recovery_codes_regenerated',
                    ip: ip ?? null,
                    user_agent: userAgent ?? null,
                },
            });
        });

        return {
            recovery_codes: rawCodes,
        };
    }
}
