import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../../../src/shared/infrastructure/http/middlewares/authMiddleware';
import { JwtService } from '../../../src/shared/application/services/jwtService';
import { PrismaUserRepository } from '../../../src/modules/users/infrastructure/persistence/PrismaUserRepository';
import { LoginUserUseCase } from '../../../src/modules/users/application/loginUserUseCase';
import { RateLimiter } from '../../../src/shared/application/services/rateLimiter';
import { prisma } from '../../../src/shared/infrastructure/database';
import { stub, restoreAll, recorder } from '../../helpers/stubs';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'ana@empresa.com';
const jwt = new JwtService();

const fakeReply = () => {
    const reply: any = { request: { headers: {} }, statusCode: 200, body: undefined };
    reply.status = (code: number) => { reply.statusCode = code; return reply; };
    reply.send = (body: any) => { reply.body = body; return reply; };
    return reply;
};

const callMiddleware = async (token: string) => {
    const reply = fakeReply();
    const request: any = { headers: { authorization: `Bearer ${token}` } };
    await authMiddleware(request, reply);
    return { reply, request };
};

const stubUser = (tokenVersion: number, overrides: any = {}) =>
    stub(PrismaUserRepository.prototype, 'findById', async () => ({
        id: USER_ID, email: EMAIL, company_id: null, is_active: true, token_version: tokenVersion, ...overrides,
    }));

afterEach(restoreAll);

describe('authMiddleware', () => {
    test('a session token with the current token_version passes', async () => {
        stubUser(3);
        const { reply, request } = await callMiddleware(jwt.generateToken({ userId: USER_ID, email: EMAIL, tv: 3 }));
        assert.equal(reply.statusCode, 200);
        assert.equal(request.user.userId, USER_ID);
    });

    test('after a password change (token_version bumped) the old session is revoked', async () => {
        stubUser(4);
        const { reply } = await callMiddleware(jwt.generateToken({ userId: USER_ID, email: EMAIL, tv: 3 }));
        assert.equal(reply.statusCode, 401);
        assert.equal(reply.body.error.code, 'SESSION_REVOKED');
    });

    test('an mfa step token can NOT be used as a session', async () => {
        stubUser(0);
        const mfa = jwt.generateStepToken({ userId: USER_ID, email: EMAIL, purpose: 'mfa' });
        const { reply } = await callMiddleware(mfa);
        assert.equal(reply.statusCode, 401);
    });

    test('an enrollment step token can NOT be used as a session', async () => {
        stubUser(0);
        const enroll = jwt.generateStepToken({ userId: USER_ID, email: EMAIL, purpose: 'mfa_enroll' });
        const { reply } = await callMiddleware(enroll);
        assert.equal(reply.statusCode, 401);
    });

    test('an admin token is not accepted on user routes', async () => {
        stubUser(0);
        const admin = jwt.generateToken({ userId: USER_ID, email: EMAIL, actorType: 'admin', adminId: 'a', role: 'superadmin' });
        const { reply } = await callMiddleware(admin);
        assert.equal(reply.statusCode, 401);
    });
});

describe('JwtService secret', () => {
    test('without JWT_SECRET it refuses to start, even if a path in argv contains "test"', () => {
        const saved = { secret: process.env.JWT_SECRET, env: process.env.NODE_ENV, argv: process.argv };
        try {
            delete process.env.JWT_SECRET;
            process.env.NODE_ENV = 'production';
            process.argv = [...process.argv, '/opt/latest/dist/server.js'];
            assert.throws(() => new JwtService(), /JWT_SECRET/);
        } finally {
            if (saved.secret !== undefined) process.env.JWT_SECRET = saved.secret;
            process.env.NODE_ENV = saved.env;
            process.argv = saved.argv;
        }
    });
});

describe('LoginUserUseCase brute-force limits', () => {
    const setup = async (limit: { allowed: boolean }, validPassword = false) => {
        const hash = await bcrypt.hash('Correcta#2026', 4);
        stub(PrismaUserRepository.prototype, 'findByEmail', async () => ({
            id: USER_ID, email: EMAIL, password: hash, is_active: true, company_id: null, first_name: 'Ana', last_name: 'P', token_version: 0,
        }));
        stub(PrismaUserRepository.prototype, 'update', async (u: any) => u);
        stub(prisma.user, 'findUnique', async () => ({ two_factor: null, company: null }));
        stub(RateLimiter, 'check', async () => ({ allowed: limit.allowed, current: 0, remaining: 5, resetInSeconds: 0 }));
        const consume = recorder(async () => ({ allowed: true, current: 1, remaining: 4, resetInSeconds: 60 }));
        const reset = recorder(async () => undefined);
        stub(RateLimiter, 'consume', consume);
        stub(RateLimiter, 'reset', reset);
        const run = () => new LoginUserUseCase().execute({ email: EMAIL, password: validPassword ? 'Correcta#2026' : 'incorrecta', ip: '10.0.0.9' } as any);
        return { run, consume, reset };
    };

    test('a blocked (email, IP) gets 429 before any password check', async () => {
        const { run, consume } = await setup({ allowed: false });
        await assert.rejects(run(), { code: 'TOO_MANY_REQUESTS' });
        assert.equal(consume.calls.length, 0);
    });

    test('a wrong password counts a failure for the (email, IP) pair and for the IP', async () => {
        const { run, consume } = await setup({ allowed: true });
        await assert.rejects(run(), { code: 'USER_INVALID_CREDENTIALS' });
        const keys = consume.calls.map(([o]) => o.key as string);
        assert.equal(keys.some((k) => /^rl:login:[0-9a-f]{64}:10\.0\.0\.9$/.test(k)), true);
        assert.equal(keys.includes('rl:login:ip:10.0.0.9'), true);
    });

    test('a correct password clears the (email, IP) counter and counts nothing', async () => {
        const { run, consume, reset } = await setup({ allowed: true }, true);
        const result: any = await run();
        assert.ok(result.token);
        assert.equal(consume.calls.length, 0);
        assert.equal(reset.calls.length, 1);
    });
});
