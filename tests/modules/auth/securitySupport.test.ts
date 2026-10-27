import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../src/shared/infrastructure/database';
import { assertOwnCompany } from '../../../src/modules/companies/infrastructure/http/assertOwnCompany';
import { GetTwoFactorStatusUseCase } from '../../../src/modules/auth/application/getTwoFactorStatusUseCase';
import { ValidateResetTokenUseCase } from '../../../src/modules/auth/application/validateResetTokenUseCase';
import { RateLimiter } from '../../../src/shared/application/services/rateLimiter';
import { stub, restoreAll, recorder } from '../../helpers/stubs';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const MY_COMPANY = '33333333-3333-4333-8333-333333333333';
const OTHER_COMPANY = '44444444-4444-4444-8444-444444444444';

afterEach(restoreAll);

describe('assertOwnCompany (company settings)', () => {
    test('the own company passes', () => {
        assert.doesNotThrow(() => assertOwnCompany({ user: { companyId: MY_COMPANY } }, MY_COMPANY));
    });

    test('another company is forbidden', () => {
        assert.throws(() => assertOwnCompany({ user: { companyId: MY_COMPANY } }, OTHER_COMPANY), { statusCode: 403 });
    });

    test('a user without company is forbidden', () => {
        assert.throws(() => assertOwnCompany({ user: { companyId: null } }, MY_COMPANY), { statusCode: 403 });
        assert.throws(() => assertOwnCompany({}, MY_COMPANY), { statusCode: 403 });
    });
});

describe('GetTwoFactorStatusUseCase', () => {
    const setup = (user: any, remaining = 0) => {
        stub(prisma.user, 'findUnique', async () => user);
        const count = recorder(async () => remaining);
        stub(prisma.userRecoveryCode, 'count', count);
        return { count };
    };
    const run = () => new GetTwoFactorStatusUseCase().execute({ userId: USER_ID });

    test('2FA active: reports the date and the unused recovery codes', async () => {
        const enabledAt = new Date('2026-10-01T10:00:00Z');
        const { count } = setup({ password_changed_at: null, two_factor: { enabled_at: enabledAt }, company: { settings: { two_factor_required: false } } }, 7);
        const status = await run();
        assert.equal(status.enabled, true);
        assert.equal(status.recovery_codes_remaining, 7);
        assert.deepEqual(count.calls[0]![0].where, { user_id: USER_ID, used_at: null });
    });

    test('2FA pending enrollment (secret saved, not confirmed) counts as disabled', async () => {
        const { count } = setup({ password_changed_at: null, two_factor: { enabled_at: null }, company: null });
        const status = await run();
        assert.equal(status.enabled, false);
        assert.equal(status.recovery_codes_remaining, 0);
        assert.equal(count.calls.length, 0);
    });

    test('exposes the company policy', async () => {
        setup({ password_changed_at: null, two_factor: null, company: { settings: { two_factor_required: true } } });
        assert.equal((await run()).company_requires_2fa, true);
    });
});

describe('ValidateResetTokenUseCase rate limit', () => {
    test('an IP over the limit gets 429 before the token is looked up', async () => {
        stub(RateLimiter, 'consume', async () => ({ allowed: false, current: 61, remaining: 0, resetInSeconds: 100 }));
        const find = recorder(async () => null);
        stub(prisma.passwordResetToken, 'findUnique', find);
        await assert.rejects(new ValidateResetTokenUseCase().execute({ token: 'x', ip: '10.0.0.1' } as any), { code: 'TOO_MANY_REQUESTS' });
        assert.equal(find.calls.length, 0);
    });
});
