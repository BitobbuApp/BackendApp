import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { TokenGenerator } from '../../../shared/application/services/tokenGenerator';
import { ResetTokenInvalidError } from '../domain/errors/auth.errors';

interface ValidateResetTokenInput {
    token: string;
}

interface ValidateResetTokenOutput {
    valid: boolean;
    requires_two_factor: boolean;
    email_hint: string;
}

export class ValidateResetTokenUseCase extends UseCase<ValidateResetTokenInput, ValidateResetTokenOutput> {
    protected inputSchema = Joi.object({
        token: Joi.string().required().trim(),
    });

    protected outputSchema = Joi.any();

    protected async implementation({ token }: ValidateResetTokenInput): Promise<ValidateResetTokenOutput> {
        const tokenHash = TokenGenerator.hashToken(token);
        const now = new Date();

        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token_hash: tokenHash },
            include: {
                user: {
                    include: {
                        two_factor: true,
                    },
                },
            },
        });

        // Safe failure: Same error whether token doesn't exist, is expired, used, or had >= 5 failed attempts
        if (
            !tokenRecord ||
            tokenRecord.used_at !== null ||
            tokenRecord.invalidated_at !== null ||
            tokenRecord.expires_at <= now ||
            tokenRecord.failed_attempts >= 5
        ) {
            throw new ResetTokenInvalidError();
        }

        const requiresTwoFactor = Boolean(tokenRecord.user.two_factor?.enabled_at);

        // Mask email: ana.perez@empresa.com -> a***z@empresa.com
        const [localPart = '', domain = ''] = tokenRecord.user.email.split('@');
        let maskedLocal = localPart.length > 2
            ? `${localPart.charAt(0)}***${localPart.charAt(localPart.length - 1)}`
            : `${localPart.charAt(0)}***`;
        const emailHint = `${maskedLocal}@${domain}`;

        return {
            valid: true,
            requires_two_factor: requiresTwoFactor,
            email_hint: emailHint,
        };
    }
}
