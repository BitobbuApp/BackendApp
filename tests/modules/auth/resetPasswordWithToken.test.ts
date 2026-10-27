import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { prisma } from '../../../src/shared/infrastructure/database';
import { ResetPasswordWithTokenUseCase } from '../../../src/modules/auth/application/resetPasswordWithTokenUseCase';
import { RateLimiter } from '../../../src/shared/application/services/rateLimiter';
import { TokenGenerator } from '../../../src/shared/application/services/tokenGenerator';
import { EncryptionService } from '../../../src/shared/application/services/encryptionService';
import { TotpService } from '../../../src/shared/application/services/totpService';
import { MailgunEmailAdapter } from '../../../src/shared/infrastructure/notifications/mailgunEmailAdapter';
import { stub, restoreAll, recorder } from '../../helpers/stubs';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const TOKEN_ID = '55555555-5555-4555-8555-555555555555';
const RECOVERY_ID = '66666666-6666-4666-8666-666666666666';
const OLD_PASSWORD = 'ClaveVieja#2025';
const NEW_PASSWORD = 'ClaveNueva#2026!';

const totp = new TotpService();
const encryption = new EncryptionService();
const SECRET = totp.generateSecret();

/** A real TOTP code for the current time (the use case checks it against the encrypted secret). */
const currentCode = () => {
    // verifyTotp accepts +-1 step; derive the code by brute force over the 10^6 space would be slow, so use the service
    const service = totp as any;
    return service.generateCodeForStep(service.base32Decode(SECRET), BigInt(Math.floor(Date.now() / 1000 / 30)));
};

interface Options {
    withTwoFactor?: boolean;
    failedAttempts?: number;
    userBlocked?: boolean;
    lastUsedStep?: bigint | null;
    consumeCount?: number;
    history?: string[];
}

/** Fakes the DB (token, user, history, transaction) and Redis; records every write. */
async function setup(options: Options = {}) {
    const { withTwoFactor = false, failedAttempts = 0, userBlocked = false, lastUsedStep = null, consumeCount = 1 } = options;
    const encrypted = encryption.encrypt(SECRET);
    const tokenValue = 'opaque-token-for-tests';
    const history = await Promise.all((options.history ?? [OLD_PASSWORD]).map((p, i) => bcrypt.hash(p, 4).then((h) => ({
        id: `h${i}`, user_id: USER_ID, password_hash: h, created_at: new Date(),
    }))));

    const tokenRecord = {
        id: TOKEN_ID, user_id: USER_ID, token_hash: TokenGenerator.hashToken(tokenValue),
        expires_at: new Date(Date.now() + 600_000), used_at: null, invalidated_at: null, failed_attempts: failedAttempts,
        user: {
            id: USER_ID, email: 'ana@empresa.com', first_name: 'Ana', company_id: null,
            two_factor: withTwoFactor ? {
                user_id: USER_ID, secret_ciphertext: encrypted.ciphertext, secret_iv: encrypted.iv, secret_tag: encrypted.tag,
                key_version: encrypted.keyVersion, enabled_at: new Date(), last_used_step: lastUsedStep,
            } : null,
            company: null,
        },
    };

    // order of the writes that matter
    const order: string[] = [];
    const tokenUpdate = recorder(async ({ data }: any) => {
        if (data.failed_attempts) order.push('spend-attempt');
        return { failed_attempts: tokenRecord.failed_attempts + 1 };
    });
    stub(prisma.passwordResetToken, 'findUnique', async () => tokenRecord);
    stub(prisma.passwordResetToken, 'update', tokenUpdate);
    stub(prisma.passwordHistory, 'findMany', async () => history);
    stub(prisma.userRecoveryCode, 'findFirst', async () => (options as any).recovery ? { id: RECOVERY_ID } : null);
    const securityEvents = recorder(async () => ({}));
    stub(prisma.securityEvent, 'create', securityEvents);

    const tx = {
        passwordResetToken: { updateMany: recorder(async () => ({ count: consumeCount })) },
        userTwoFactor: { updateMany: recorder(async () => ({ count: 1 })) },
        userRecoveryCode: { updateMany: recorder(async () => ({ count: 1 })) },
        user: { update: recorder(async () => ({ id: USER_ID, company_id: null, password_changed_at: new Date(), token_version: 1 })) },
        passwordHistory: { create: recorder(async () => ({})), findMany: async () => [{ id: 'h0' }], deleteMany: recorder(async () => ({})) },
        securityEvent: { create: securityEvents },
    };
    const transaction = recorder(async (fn: any) => fn(tx));
    stub(prisma, '$transaction', transaction);

    const consume = recorder(async () => ({ allowed: true, current: 1, remaining: 9, resetInSeconds: 60 }));
    stub(RateLimiter, 'consume', consume);
    stub(RateLimiter, 'check', async () => ({ allowed: !userBlocked, current: 0, remaining: 10, resetInSeconds: 0 }));
    stub(MailgunEmailAdapter.prototype, 'sendTemplate', async () => undefined);

    const run = (extra: any = {}) => new ResetPasswordWithTokenUseCase().execute({
        token: tokenValue, new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD, ip: '10.0.0.1', ...extra,
    });
    return { run, tx, transaction, tokenUpdate, consume, order, securityEvents };
}

afterEach(restoreAll);

describe('ResetPasswordWithTokenUseCase', () => {
    test('without 2FA: consumes the token and changes the password in one transaction', async () => {
        const { run, tx, transaction } = await setup();
        const result: any = await run();

        assert.equal(result.success, true);
        assert.equal(transaction.calls.length, 1);
        assert.equal(tx.passwordResetToken.updateMany.calls.length >= 1, true);
        const userUpdate = tx.user.update.calls[0]![0].data;
        assert.deepEqual(userUpdate.token_version, { increment: 1 });
        assert.notEqual(userUpdate.password, NEW_PASSWORD);
    });

    test('a password from the history is rejected and the token is NOT consumed', async () => {
        const { run, transaction, tx } = await setup();
        await assert.rejects(run({ new_password: OLD_PASSWORD, confirm_password: OLD_PASSWORD }), { code: 'PASSWORD_RECENTLY_USED' });
        assert.equal(transaction.calls.length, 0);
        assert.equal(tx.passwordResetToken.updateMany.calls.length, 0);
    });

    test('a rejected password burns neither the TOTP step nor a recovery code', async () => {
        const totpCase = await setup({ withTwoFactor: true });
        await assert.rejects(
            totpCase.run({ totp_code: currentCode(), new_password: OLD_PASSWORD, confirm_password: OLD_PASSWORD }),
            { code: 'PASSWORD_RECENTLY_USED' },
        );
        assert.equal(totpCase.tx.userTwoFactor.updateMany.calls.length, 0);
        restoreAll();

        const recoveryCase = await setup({ withTwoFactor: true, recovery: true } as any);
        await assert.rejects(
            recoveryCase.run({ recovery_code: 'ABCDE-FGHJK', new_password: OLD_PASSWORD, confirm_password: OLD_PASSWORD }),
            { code: 'PASSWORD_RECENTLY_USED' },
        );
        assert.equal(recoveryCase.tx.userRecoveryCode.updateMany.calls.length, 0);
    });

    test('2FA user without a code gets TWO_FACTOR_REQUIRED and spends no attempt', async () => {
        const { run, tokenUpdate } = await setup({ withTwoFactor: true });
        await assert.rejects(run(), { code: 'TWO_FACTOR_REQUIRED' });
        assert.equal(tokenUpdate.calls.length, 0);
    });

    test('valid TOTP: the step is committed inside the transaction', async () => {
        const { run, tx, consume } = await setup({ withTwoFactor: true });
        await run({ totp_code: currentCode() });
        assert.equal(tx.userTwoFactor.updateMany.calls.length, 1);
        assert.equal(typeof tx.userTwoFactor.updateMany.calls[0]![0].data.last_used_step, 'bigint');
        // a correct code does not count against the per-user failure limit
        assert.equal(consume.calls.some(([o]) => String(o.key).startsWith('rl:totp:user:')), false);
    });

    test('a replayed TOTP step is rejected', async () => {
        const step = BigInt(Math.floor(Date.now() / 1000 / 30)) + 5n; // newer than any step in the +-1 window
        const { run } = await setup({ withTwoFactor: true, lastUsedStep: step });
        await assert.rejects(run({ totp_code: currentCode() }), { code: 'TWO_FACTOR_INVALID' });
    });

    test('wrong TOTP: the attempt is spent BEFORE verifying and the per-user failure is counted', async () => {
        const { run, order, consume, tx } = await setup({ withTwoFactor: true });
        await assert.rejects(run({ totp_code: '000000' }), { code: 'TWO_FACTOR_INVALID' });
        assert.deepEqual(order, ['spend-attempt']);
        assert.equal(consume.calls.some(([o]) => o.key === `rl:totp:user:${USER_ID}`), true);
        assert.equal(tx.passwordResetToken.updateMany.calls.length, 0);
    });

    test('the fifth failed attempt invalidates the link', async () => {
        const { run, tokenUpdate } = await setup({ withTwoFactor: true, failedAttempts: 4 });
        await assert.rejects(run({ totp_code: '000000' }), { code: 'RESET_TOKEN_INVALID' });
        assert.equal(tokenUpdate.calls.some(([a]) => a.data.invalidated_at instanceof Date), true);
    });

    test('a user blocked by the per-user 2FA limit cancels the link and gets 429', async () => {
        const { run, tokenUpdate } = await setup({ withTwoFactor: true, userBlocked: true });
        await assert.rejects(run({ totp_code: currentCode() }), { code: 'TOO_MANY_REQUESTS' });
        assert.equal(tokenUpdate.calls.some(([a]) => a.data.invalidated_at instanceof Date), true);
    });

    test('recovery code: marked as used inside the transaction', async () => {
        const { run, tx } = await setup({ withTwoFactor: true, recovery: true } as any);
        await run({ recovery_code: 'ABCDE-FGHJK' });
        assert.equal(tx.userRecoveryCode.updateMany.calls.length, 1);
        assert.deepEqual(tx.userRecoveryCode.updateMany.calls[0]![0].where, { id: RECOVERY_ID, user_id: USER_ID, used_at: null });
    });

    test('two parallel submissions: the one that loses the token race fails and changes nothing', async () => {
        const { run, tx } = await setup({ consumeCount: 0 });
        await assert.rejects(run(), { code: 'RESET_TOKEN_INVALID' });
        assert.equal(tx.user.update.calls.length, 0);
    });
});
