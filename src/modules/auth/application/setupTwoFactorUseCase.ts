import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { TotpService } from '../../../shared/application/services/totpService';
import { EncryptionService } from '../../../shared/application/services/encryptionService';
import { ApplicationError } from '../../../shared/domain/error';

interface SetupTwoFactorInput {
    userId: string;
}

interface SetupTwoFactorOutput {
    secret: string;
    otpauth_url: string;
}

export class SetupTwoFactorUseCase extends UseCase<SetupTwoFactorInput, SetupTwoFactorOutput> {
    protected inputSchema = Joi.object({
        userId: Joi.string().uuid().required(),
    });

    protected outputSchema = Joi.any();

    private readonly totpService: TotpService;
    private readonly encryptionService: EncryptionService;

    constructor() {
        super();
        this.totpService = new TotpService();
        this.encryptionService = new EncryptionService();
    }

    protected async implementation({ userId }: SetupTwoFactorInput): Promise<SetupTwoFactorOutput> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { two_factor: true },
        });

        if (!user) {
            throw new ApplicationError(404, 'Usuario no encontrado');
        }

        if (user.two_factor?.enabled_at) {
            throw new ApplicationError(409, 'La autenticación en dos factores ya se encuentra activa.');
        }

        // Generate clean base32 secret
        const secret = this.totpService.generateSecret();
        const encrypted = this.encryptionService.encrypt(secret);
        const now = new Date();

        // Upsert pending 2FA record
        await prisma.userTwoFactor.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                secret_ciphertext: encrypted.ciphertext,
                secret_iv: encrypted.iv,
                secret_tag: encrypted.tag,
                key_version: encrypted.keyVersion,
                enabled_at: null,
                created_at: now,
                updated_at: now,
            },
            update: {
                secret_ciphertext: encrypted.ciphertext,
                secret_iv: encrypted.iv,
                secret_tag: encrypted.tag,
                key_version: encrypted.keyVersion,
                enabled_at: null,
                updated_at: now,
            },
        });

        const otpauthUrl = this.totpService.generateOtpAuthUri(user.email, secret);

        return {
            secret,
            otpauth_url: otpauthUrl,
        };
    }
}
