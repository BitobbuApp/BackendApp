import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../src/shared/infrastructure/database';
import { VerifyLoginTwoFactorUseCase } from '../../../src/modules/auth/application/verifyLoginTwoFactorUseCase';
import { JwtService } from '../../../src/shared/application/services/jwtService';
import { RateLimiter } from '../../../src/shared/application/services/rateLimiter';
import { EncryptionService } from '../../../src/shared/application/services/encryptionService';
import { TotpService } from '../../../src/shared/application/services/totpService';
import { stub, restoreAll, recorder } from '../../helpers/stubs';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'ana@empresa.com';
const jwt = new JwtService();
const totp = new TotpService();
const SECRET = totp.generateSecret();

const currentCode = () => {
    const service = totp as any;
    return service.generateCodeForStep(service.base32Decode(SECRET), BigInt(Math.floor(Date.now() / 1000 / 30)));
};

interface Options { userBlocked?: boolean; tokenBlocked?: boolean; recovery?: boolean; stepLost?: boolean }

function setup(options: Options = {}) {
    const encrypted = new EncryptionService().encrypt(SECRET);
    stub(prisma.user, 'findUnique', async () => ({
        id: USER_ID, email: EMAIL, first_name: 'Ana', last_name: 'P', is_active: true, company_id: null,
        two_factor: {
            user_id: USER_ID, secret_ciphertext: encrypted.ciphertext, secret_iv: encrypted.iv, secret_tag: encrypted.tag,
            key_version: encrypted.keyVersion, enabled_at: new Date(), last_used_step: null,
        },
    }));
    stub(prisma.user, 'update', async () => ({
        id: USER_ID, email: EMAIL, first_name: 'Ana', last_name: 'P', is_active: true, company_id: null, token_version: 7,
    }));
    stub(prisma.userRecoveryCode, 'findFirst', async () => (options.recovery ? { id: 'rc1' } : null));
    const stepUpdate = recorder(async () => ({ count: options.stepLost ? 0 : 1 }));
    const recoveryUpdate = recorder(async () => ({ count: 1 }));
    const tx = {
        userTwoFactor: { updateMany: stepUpdate },
        userRecoveryCode: { updateMany: recoveryUpdate },
        securityEvent: { create: async () => ({}) },
    };
    stub(prisma, '$transaction', async (fn: any) => fn(tx));
    stub(prisma.securityEvent, 'create', async () => ({}));

    // check(): the first call is the per-mfa_token cap, the second the per-user cap
    const checks: string[] = [];
    stub(RateLimiter, 'check', async (key: string) => {
        checks.push(key);
        const blocked = key.startsWith('rl:mfa:') ? options.tokenBlocked : options.userBlocked;
        return { allowed: !blocked, current: 0, remaining: 5, resetInSeconds: 0 };
    });
    const consume = recorder(async () => ({ allowed: true, current: 1, remaining: 9, resetInSeconds: 60 }));
    stub(RateLimiter, 'consume', consume);

    const mfaToken = jwt.generateStepToken({ userId: USER_ID, email: EMAIL, purpose: 'mfa' });
    const run = (code: string, token = mfaToken) => new VerifyLoginTwoFactorUseCase().execute({ mfa_token: token, code, ip: '10.0.0.1' });
    return { run, consume, stepUpdate, recoveryUpdate };
}

afterEach(restoreAll);

describe('VerifyLoginTwoFactorUseCase', () => {
    test('a valid TOTP returns a session whose tv matches the current token_version', async () => {
        const { run, consume, stepUpdate } = setup();
        const result: any = await run(currentCode());
        const decoded = jwt.verifyToken(result.token)!;
        assert.equal(decoded.userId, USER_ID);
        assert.equal(decoded.tv, 7);
        assert.equal(decoded.purpose, undefined);
        assert.equal(stepUpdate.calls.length, 1);
        // a correct code is not a failure
        assert.equal(consume.calls.length, 0);
    });

    test('a wrong code counts a failure for the user and for the mfa_token', async () => {
        const { run, consume } = setup();
        await assert.rejects(run('000000'), { code: 'TWO_FACTOR_INVALID' });
        const keys = consume.calls.map(([o]) => o.key as string);
        assert.equal(keys.includes(`rl:totp:user:${USER_ID}`), true);
        assert.equal(keys.some((k) => k.startsWith('rl:mfa:')), true);
    });

    test('a recovery code logs in and is marked as used', async () => {
        const { run, recoveryUpdate } = setup({ recovery: true });
        const result: any = await run('ABCDE-FGHJK');
        assert.ok(result.token);
        assert.equal(recoveryUpdate.calls.length, 1);
    });

    test('losing the race for the same TOTP step is a failed attempt', async () => {
        const { run } = setup({ stepLost: true });
        await assert.rejects(run(currentCode()), { code: 'TWO_FACTOR_INVALID' });
    });

    test('a mfa_token with too many failures is refused even before checking the code', async () => {
        const { run, stepUpdate } = setup({ tokenBlocked: true });
        await assert.rejects(run(currentCode()), { code: 'MFA_TOKEN_INVALID' });
        assert.equal(stepUpdate.calls.length, 0);
    });

    test('a user blocked by the 2FA failure limit gets 429', async () => {
        const { run } = setup({ userBlocked: true });
        await assert.rejects(run(currentCode()), { code: 'TOO_MANY_REQUESTS' });
    });

    test('a normal session token or an enrollment token is not accepted as mfa_token', async () => {
        const { run } = setup();
        const session = jwt.generateToken({ userId: USER_ID, email: EMAIL, tv: 7 });
        const enroll = jwt.generateStepToken({ userId: USER_ID, email: EMAIL, purpose: 'mfa_enroll' });
        await assert.rejects(run(currentCode(), session), { code: 'MFA_TOKEN_INVALID' });
        await assert.rejects(run(currentCode(), enroll), { code: 'MFA_TOKEN_INVALID' });
    });
});
