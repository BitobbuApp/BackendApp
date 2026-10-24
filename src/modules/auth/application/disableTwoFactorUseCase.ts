import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { PasswordHasher } from '../../../shared/application/services/passwordHasher';
import { EncryptionService } from '../../../shared/application/services/encryptionService';
import { TotpService } from '../../../shared/application/services/totpService';
import {
    TwoFactorEnforcedByCompanyError,
    TwoFactorInvalidError,
} from '../domain/errors/auth.errors';
import { InvalidCredentialsError } from '../../users/domain/errors/user.errors';
import { ApplicationError } from '../../../shared/domain/error';
import { MailgunEmailAdapter } from '../../../shared/infrastructure/notifications/mailgunEmailAdapter';
import { EmailService } from '../../../shared/application/services/email.service';
import { notifyTwoFactorChange } from './helpers/notifyTwoFactorChange';
import { JwtService } from '../../../shared/application/services/jwtService';
import { TwoFactorAttemptGuard } from '../domain/services/twoFactorAttemptGuard';

interface DisableTwoFactorInput {
    userId: string;
    password: string;
    code: string;
    ip?: string;
    userAgent?: string;
}

interface DisableTwoFactorOutput {
    success: boolean;
    message: string;
    token: string;
}

export class DisableTwoFactorUseCase extends UseCase<DisableTwoFactorInput, DisableTwoFactorOutput> {
    protected inputSchema = Joi.object({
        userId: Joi.string().uuid().required(),
        password: Joi.string().required(),
        code: Joi.string().required().trim(),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });

    protected outputSchema = Joi.any();
    private readonly emailService: EmailService = new MailgunEmailAdapter();

    private readonly passwordHasher: PasswordHasher;
    private readonly encryptionService: EncryptionService;
    private readonly totpService: TotpService;

    constructor() {
        super();
        this.passwordHasher = new PasswordHasher();
        this.encryptionService = new EncryptionService();
        this.totpService = new TotpService();
    }

    protected async implementation(payload: DisableTwoFactorInput): Promise<DisableTwoFactorOutput> {
        const { userId, password, code, ip, userAgent } = payload;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                two_factor: true,
                company: {
                    include: {
                        settings: true,
                    },
                },
            },
        });

        if (!user || !user.two_factor?.enabled_at) {
            throw new ApplicationError(400, 'La autenticación en dos factores no está activa.');
        }

        // Check if enforced by company policy
        if (user.company?.settings?.two_factor_required) {
            throw new TwoFactorEnforcedByCompanyError();
        }

        await TwoFactorAttemptGuard.assertNotBlocked(userId);

        // Verify password
        const isPasswordValid = await this.passwordHasher.compare(password, user.password);
        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        // Verify TOTP or recovery code
        const secretBase32 = this.encryptionService.decrypt(
            user.two_factor.secret_ciphertext,
            user.two_factor.secret_iv,
            user.two_factor.secret_tag,
            user.two_factor.key_version
        );

        const verifyTotp = this.totpService.verifyTotp(code, secretBase32, user.two_factor.last_used_step);
        let codeValid = verifyTotp.valid;

        if (!codeValid) {
            // Check recovery code
            const recoveryHash = this.totpService.hashRecoveryCode(code);
            const matchingCode = await prisma.userRecoveryCode.findFirst({
                where: { user_id: userId, code_hash: recoveryHash, used_at: null },
            });
            if (matchingCode) {
                codeValid = true;
            }
        }

        if (!codeValid) {
            await TwoFactorAttemptGuard.registerFailure(userId);
            throw new TwoFactorInvalidError();
        }

        // Atomically remove 2FA and increment token_version to refresh sessions
        const updatedUser = await prisma.$transaction(async (tx) => {
            await tx.userTwoFactor.delete({ where: { user_id: userId } });
            await tx.userRecoveryCode.deleteMany({ where: { user_id: userId } });
            const bumped = await tx.user.update({
                where: { id: userId },
                data: { token_version: { increment: 1 } },
            });

            await tx.securityEvent.create({
                data: {
                    user_id: userId,
                    company_id: user.company_id ?? null,
                    event_type: 'two_factor_disabled',
                    ip: ip ?? null,
                    user_agent: userAgent ?? null,
                },
            });

            return bumped;
        });

        // Fresh session so the user who disabled 2FA is not logged out by the token_version bump
        const token = new JwtService().generateToken({
            userId: updatedUser.id,
            companyId: updatedUser.company_id ?? null,
            email: updatedUser.email,
            tv: updatedUser.token_version,
        });

        notifyTwoFactorChange(this.emailService, user, 'desactivado', ip);

        return {
            success: true,
            message: 'La autenticación en dos factores ha sido desactivada.',
            token,
        };
    }
}
