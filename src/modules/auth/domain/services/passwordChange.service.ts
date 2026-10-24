import { prisma } from '../../../../shared/infrastructure/database';
import { PasswordRecentlyUsedError } from '../errors/auth.errors';
import { PasswordHasher } from '../../../../shared/application/services/passwordHasher';
import { Prisma } from '@prisma/client';

export interface ChangePasswordOptions {
    userId: string;
    newPassword: string;
    reason: 'password_changed' | 'password_reset_completed';
    ip?: string | undefined;
    userAgent?: string | undefined;
    companyId?: string | null;
    /**
     * Runs inside the same transaction, after the history check passed: consume the reset token, mark the TOTP
     * step / recovery code as used. If it throws, nothing is persisted (a rejected password burns nothing).
     */
    beforeCommit?: (tx: Prisma.TransactionClient) => Promise<void>;
}

export interface ChangePasswordResult {
    tokenVersion: number;
    passwordChangedAt: Date;
}

export class PasswordChangeService {
    private readonly passwordHasher: PasswordHasher;

    constructor(passwordHasher?: PasswordHasher) {
        this.passwordHasher = passwordHasher || new PasswordHasher();
    }

    /**
     * Checks password history against the last 5 stored passwords.
     * Throws PasswordRecentlyUsedError if matched.
     * Atomically updates user password, increments token_version, prunes history to 5,
     * invalidates pending reset tokens, and logs security event.
     */
    async changePassword(options: ChangePasswordOptions): Promise<ChangePasswordResult> {
        const { userId, newPassword, reason, ip, userAgent, companyId, beforeCommit } = options;

        // 1. Fetch up to last 5 passwords from history
        const recentHistory = await prisma.passwordHistory.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 5,
        });

        // 2. Check if newPassword matches any of the recent 5 hashes
        for (const record of recentHistory) {
            const isMatch = await this.passwordHasher.compare(newPassword, record.password_hash);
            if (isMatch) {
                // Log attempt to security events
                await prisma.securityEvent.create({
                    data: {
                        user_id: userId,
                        company_id: companyId ?? null,
                        event_type: 'password_reuse_rejected',
                        ip: ip ?? null,
                        user_agent: userAgent ?? null,
                    },
                }).catch(() => null);

                throw new PasswordRecentlyUsedError();
            }
        }

        // 3. Hash the new password with bcrypt (cost 12)
        const newPasswordHash = await this.passwordHasher.hash(newPassword);
        const now = new Date();

        // 4. Atomic transaction
        const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (beforeCommit) await beforeCommit(tx);

            // Update user password and increment token_version
            const user = await tx.user.update({
                where: { id: userId },
                data: {
                    password: newPasswordHash,
                    password_changed_at: now,
                    token_version: { increment: 1 },
                },
            });

            // Insert new password into history
            await tx.passwordHistory.create({
                data: {
                    user_id: userId,
                    password_hash: newPasswordHash,
                    created_at: now,
                },
            });

            // Keep only the 5 most recent records and prune older ones
            const keepRecords = await tx.passwordHistory.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
                take: 5,
                select: { id: true },
            });

            const keepIds = keepRecords.map((r) => r.id);
            await tx.passwordHistory.deleteMany({
                where: {
                    user_id: userId,
                    id: { notIn: keepIds },
                },
            });

            // Invalidate any other open password reset tokens for this user
            await tx.passwordResetToken.updateMany({
                where: {
                    user_id: userId,
                    used_at: null,
                    invalidated_at: null,
                },
                data: {
                    invalidated_at: now,
                },
            });

            // Log security audit event
            await tx.securityEvent.create({
                data: {
                    user_id: userId,
                    company_id: companyId ?? user.company_id ?? null,
                    event_type: reason,
                    ip: ip ?? null,
                    user_agent: userAgent ?? null,
                },
            });

            return user;
        });

        return {
            tokenVersion: updatedUser.token_version,
            passwordChangedAt: updatedUser.password_changed_at!,
        };
    }
}
