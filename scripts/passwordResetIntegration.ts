// Real-DB integration check of the reset flow (creates and deletes a throwaway user). Run: npx tsx scripts/passwordResetIntegration.ts
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/shared/infrastructure/database';
import { redisConnection } from '../src/shared/infrastructure/redis';
import { ResetPasswordWithTokenUseCase } from '../src/modules/auth/application/resetPasswordWithTokenUseCase';
import { ValidateResetTokenUseCase } from '../src/modules/auth/application/validateResetTokenUseCase';
import { TokenGenerator } from '../src/shared/application/services/tokenGenerator';
import { MailgunEmailAdapter } from '../src/shared/infrastructure/notifications/mailgunEmailAdapter';

(MailgunEmailAdapter.prototype as any).sendTemplate = async () => undefined;
const email = `it_${Date.now()}@example.test`;
const OLD = 'ClaveVieja#2025', NEW = 'ClaveNueva#2026!';
const out: string[] = [];
const ok = (name: string, cond: boolean) => { out.push(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

async function mkToken(userId: string) {
    const { token, tokenHash } = TokenGenerator.generateOpaqueToken();
    await prisma.passwordResetToken.create({ data: { user_id: userId, token_hash: tokenHash, expires_at: new Date(Date.now() + 600000) } });
    return { token, tokenHash };
}

(async () => {
    const hash = await bcrypt.hash(OLD, 12);
    const user = await prisma.user.create({ data: { first_name: 'It', last_name: 'Test', email, password: hash, salt: 0 } });
    await prisma.passwordHistory.create({ data: { user_id: user.id, password_hash: hash } });
    try {
        // validate does not consume
        let t = await mkToken(user.id);
        const v: any = await new ValidateResetTokenUseCase().execute({ token: t.token });
        const v2: any = await new ValidateResetTokenUseCase().execute({ token: t.token });
        ok('validate twice does not consume', v.valid && v2.valid);

        // history rejection keeps the token alive
        let rejected = '';
        try { await new ResetPasswordWithTokenUseCase().execute({ token: t.token, new_password: OLD, confirm_password: OLD, ip: '127.0.0.1' }); } catch (e: any) { rejected = e.code; }
        const afterReject = await prisma.passwordResetToken.findUnique({ where: { token_hash: t.tokenHash } });
        ok('reused password -> PASSWORD_RECENTLY_USED', rejected === 'PASSWORD_RECENTLY_USED');
        ok('...and the token is still unused', afterReject!.used_at === null);

        // success
        const res: any = await new ResetPasswordWithTokenUseCase().execute({ token: t.token, new_password: NEW, confirm_password: NEW, ip: '127.0.0.1' });
        const u = await prisma.user.findUnique({ where: { id: user.id } });
        const hist = await prisma.passwordHistory.count({ where: { user_id: user.id } });
        ok('reset succeeds', res.success === true);
        ok('new password works, old does not', (await bcrypt.compare(NEW, u!.password)) && !(await bcrypt.compare(OLD, u!.password)));
        ok('token_version incremented', u!.token_version === 1);
        ok('history has 2 rows', hist === 2);
        const used = await prisma.passwordResetToken.findUnique({ where: { token_hash: t.tokenHash } });
        ok('token marked used', used!.used_at !== null);

        // replay of the same token
        let replay = '';
        try { await new ResetPasswordWithTokenUseCase().execute({ token: t.token, new_password: 'OtraClave#2027x', confirm_password: 'OtraClave#2027x', ip: '127.0.0.1' }); } catch (e: any) { replay = e.code; }
        ok('replaying a used token -> RESET_TOKEN_INVALID', replay === 'RESET_TOKEN_INVALID');

        // two parallel submissions with a fresh token: exactly one wins
        t = await mkToken(user.id);
        const attempt = (p: string) => new ResetPasswordWithTokenUseCase().execute({ token: t.token, new_password: p, confirm_password: p, ip: '127.0.0.1' }).then(() => 'ok', (e: any) => e.code);
        const results = await Promise.all([attempt('Paralela#2028aa'), attempt('Paralela#2029bb')]);
        ok(`parallel submissions: exactly one wins (${results.join(',')})`, results.filter((r) => r === 'ok').length === 1);
        const finalUser = await prisma.user.findUnique({ where: { id: user.id } });
        ok('token_version bumped exactly once more', finalUser!.token_version === 2);

        // history is capped at 5
        for (let i = 0; i < 6; i++) {
            const tk = await mkToken(user.id);
            const p = `Ciclo#${i}Clave2030z`;
            await new ResetPasswordWithTokenUseCase().execute({ token: tk.token, new_password: p, confirm_password: p, ip: '127.0.0.1' });
        }
        ok('history capped at 5', (await prisma.passwordHistory.count({ where: { user_id: user.id } })) === 5);
    } finally {
        await prisma.securityEvent.deleteMany({ where: { user_id: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        await redisConnection.del('rl:reset:ip:127.0.0.1');
        console.log(out.join('\n'));
        await prisma.$disconnect();
        redisConnection.disconnect();
    }
})().catch((e) => { console.log(out.join('\n')); console.error('ERROR', e); process.exit(1); });
