import { Prisma, UserTwoFactor } from '@prisma/client';
import { EncryptionService } from '../../../../shared/application/services/encryptionService';
import { TotpService } from '../../../../shared/application/services/totpService';
import { TwoFactorInvalidError } from '../errors/auth.errors';

export interface TwoFactorInput {
    totp?: string | null | undefined;
    recovery?: string | null | undefined;
}

export interface TwoFactorCheck {
    method: 'totp' | 'recovery';
    step?: bigint;
    recoveryCodeId?: string;
}

/**
 * Verifies a TOTP or recovery code in two phases so callers can decide when to persist:
 * `verify` only reads; `commit` marks the TOTP step / recovery code as used and is meant to run inside the
 * same transaction as the action it protects (a rejected action then burns nothing).
 */
export class TwoFactorVerifier {
    constructor(
        private readonly encryptionService: EncryptionService = new EncryptionService(),
        private readonly totpService: TotpService = new TotpService(),
    ) {}

    async verify(
        twoFactor: UserTwoFactor,
        userId: string,
        input: TwoFactorInput,
        findRecoveryCode: (codeHash: string) => Promise<{ id: string } | null>,
    ): Promise<TwoFactorCheck | null> {
        const totp = input.totp?.trim();
        if (totp) {
            try {
                const secret = this.encryptionService.decrypt(
                    twoFactor.secret_ciphertext,
                    twoFactor.secret_iv,
                    twoFactor.secret_tag,
                    twoFactor.key_version,
                );
                const result = this.totpService.verifyTotp(totp, secret, twoFactor.last_used_step);
                if (result.valid && result.step !== undefined) return { method: 'totp', step: result.step };
            } catch {
                // undecryptable secret: treated as a failed attempt
            }
        }

        const recovery = input.recovery?.trim();
        if (recovery) {
            const record = await findRecoveryCode(this.totpService.hashRecoveryCode(recovery));
            if (record) return { method: 'recovery', recoveryCodeId: record.id };
        }

        return null;
    }

    /** Conditional writes: if a parallel request already used the same step / code, this one loses. */
    async commit(tx: Prisma.TransactionClient, userId: string, check: TwoFactorCheck, now: Date): Promise<void> {
        if (check.method === 'totp') {
            const { count } = await tx.userTwoFactor.updateMany({
                where: {
                    user_id: userId,
                    OR: [{ last_used_step: null }, { last_used_step: { lt: check.step! } }],
                },
                data: { last_used_step: check.step! },
            });
            if (count !== 1) throw new TwoFactorInvalidError();
            return;
        }

        const { count } = await tx.userRecoveryCode.updateMany({
            where: { id: check.recoveryCodeId!, user_id: userId, used_at: null },
            data: { used_at: now },
        });
        if (count !== 1) throw new TwoFactorInvalidError();
        await tx.securityEvent.create({ data: { user_id: userId, event_type: 'recovery_code_used' } });
    }
}
