import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { prisma } from '../../../src/shared/infrastructure/database';
import { PrismaUserRepository } from '../../../src/modules/users/infrastructure/persistence/PrismaUserRepository';
import { LoginUserUseCase } from '../../../src/modules/users/application/loginUserUseCase';
import { authMiddleware } from '../../../src/shared/infrastructure/http/middlewares/authMiddleware';
import { JwtService } from '../../../src/shared/application/services/jwtService';
import { RateLimiter } from '../../../src/shared/application/services/rateLimiter';
import { stub, restoreAll } from '../../helpers/stubs';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'ana@empresa.com';
const PASSWORD = 'Correcta#2026';
const jwt = new JwtService();

/** A users row as Prisma returns it, with a token_version that has already been bumped */
const row = async (tokenVersion: number) => ({
    id: USER_ID, company_id: null, company: null, first_name: 'Ana', last_name: 'P', email: EMAIL, password: await bcrypt.hash(PASSWORD, 4),
    salt: 10, is_active: true, last_access: null, created_at: new Date(), updated_at: new Date(), token_version: tokenVersion,
    two_factor: null,
});

const fakeReply = () => {
    const reply: any = { request: { headers: {} }, statusCode: 200, body: undefined };
    reply.status = (code: number) => { reply.statusCode = code; return reply; };
    reply.send = (body: any) => { reply.body = body; return reply; };
    return reply;
};

afterEach(restoreAll);

describe('token_version reaches the session token (regression: the entity dropped it)', () => {
    test('the user repository returns the stored token_version', async () => {
        const stored = await row(5);
        stub(prisma.user, 'findUnique', async () => stored);
        const repo = new PrismaUserRepository();
        assert.equal((await repo.findById(USER_ID))!.token_version, 5);
        assert.equal((await repo.findByEmail(EMAIL))!.token_version, 5);
    });

    test('a login after the version was bumped issues a token that the middleware accepts', async () => {
        const stored = await row(3);
        stub(prisma.user, 'findUnique', async () => stored);
        stub(prisma.user, 'update', async () => stored);
        stub(RateLimiter, 'check', async () => ({ allowed: true, current: 0, remaining: 5, resetInSeconds: 0 }));
        stub(RateLimiter, 'reset', async () => undefined);

        const login: any = await new LoginUserUseCase().execute({ email: EMAIL, password: PASSWORD, ip: '10.0.0.1' } as any);
        assert.equal(jwt.verifyToken(login.token)!.tv, 3);

        const reply = fakeReply();
        const request: any = { headers: { authorization: `Bearer ${login.token}` } };
        await authMiddleware(request, reply);
        assert.equal(reply.statusCode, 200);
        assert.equal(request.user.userId, USER_ID);
    });

    test('a token issued before the bump is revoked', async () => {
        const stored = await row(4);
        stub(prisma.user, 'findUnique', async () => stored);
        const reply = fakeReply();
        await authMiddleware({ headers: { authorization: `Bearer ${jwt.generateToken({ userId: USER_ID, email: EMAIL, tv: 3 })}` } } as any, reply);
        assert.equal(reply.statusCode, 401);
        assert.equal(reply.body.error.code, 'SESSION_REVOKED');
    });
});
