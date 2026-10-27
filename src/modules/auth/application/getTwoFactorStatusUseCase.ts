import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { prisma } from '../../../shared/infrastructure/database';
import { ApplicationError } from '../../../shared/domain/error';

interface GetTwoFactorStatusInput {
    userId: string;
}

export interface TwoFactorStatus {
    enabled: boolean;
    enabled_at: Date | null;
    recovery_codes_remaining: number;
    company_requires_2fa: boolean;
    password_changed_at: Date | null;
}

/** What the Security settings screen needs to show: own 2FA state plus the company policy. */
export class GetTwoFactorStatusUseCase extends UseCase<GetTwoFactorStatusInput, TwoFactorStatus> {
    protected inputSchema = Joi.object({ userId: Joi.string().uuid().required() });
    protected outputSchema = Joi.any();

    protected async implementation({ userId }: GetTwoFactorStatusInput): Promise<TwoFactorStatus> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                password_changed_at: true,
                two_factor: { select: { enabled_at: true } },
                company: { select: { settings: { select: { two_factor_required: true } } } },
            },
        });
        if (!user) throw new ApplicationError(404, 'Usuario no encontrado');

        const enabledAt = user.two_factor?.enabled_at ?? null;
        const recoveryCodesRemaining = enabledAt
            ? await prisma.userRecoveryCode.count({ where: { user_id: userId, used_at: null } })
            : 0;

        return {
            enabled: enabledAt !== null,
            enabled_at: enabledAt,
            recovery_codes_remaining: recoveryCodesRemaining,
            company_requires_2fa: Boolean(user.company?.settings?.two_factor_required),
            password_changed_at: user.password_changed_at,
        };
    }
}
