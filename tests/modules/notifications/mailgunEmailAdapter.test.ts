import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../src/shared/infrastructure/database';
import { MailgunEmailAdapter } from '../../../src/shared/infrastructure/notifications/mailgunEmailAdapter';
import { MAILGUN_SUBJECTS, MAILGUN_TEMPLATES } from '../../../src/shared/constants/email/email.constants';
import { ProcessPasswordResetJob } from '../../../src/modules/auth/application/processPasswordResetJob';
import { notifyTwoFactorChange } from '../../../src/modules/auth/application/helpers/notifyTwoFactorChange';
import { stub, restoreAll, recorder } from '../../helpers/stubs';

/** Adapter wired to a fake Mailgun client; env is restored by afterEach. */
function adapterWith(create: (domain: string, data: any) => Promise<any>) {
    const saved = { ...process.env };
    process.env.EMAIL_ENABLED = 'true';
    process.env.MAILGUN_API_KEY = 'test-key';
    process.env.EMAIL_MAILGUN_DOMAIN = 'mg.test';
    process.env.EMAIL_FROM_ADDRESS = 'no-reply@mg.test';
    const adapter = new MailgunEmailAdapter();
    (adapter as any).client = { messages: { create } };
    restores.push(() => { process.env = saved; });
    return adapter;
}
const restores: Array<() => void> = [];

afterEach(() => {
    restoreAll();
    while (restores.length) restores.pop()!();
});

describe('MailgunEmailAdapter', () => {
    test('uses the subject of the template instead of a generic fallback', async () => {
        const create = recorder(async () => ({ id: '1' }));
        await adapterWith(create).sendTemplate({ to: 'a@b.co', templateKey: 'password_reset', variables: { reset_url: 'https://x' } });

        const data = create.calls[0]![1];
        assert.equal(data.subject, MAILGUN_SUBJECTS.password_reset);
        assert.equal(data.template, MAILGUN_TEMPLATES.password_reset);
        assert.deepEqual(JSON.parse(data['t:variables']), { reset_url: 'https://x' });
    });

    test('an explicit subject wins over the template one', async () => {
        const create = recorder(async () => ({ id: '1' }));
        await adapterWith(create).sendTemplate({ to: 'a@b.co', templateKey: 'welcome', subject: 'Hola' });
        assert.equal(create.calls[0]![1].subject, 'Hola');
    });

    test('every template has a subject', () => {
        for (const key of Object.keys(MAILGUN_TEMPLATES)) {
            assert.ok(MAILGUN_SUBJECTS[key], `missing subject for ${key}`);
        }
    });

    test('a delivery failure is swallowed by default (safe fail)', async () => {
        const adapter = adapterWith(async () => { throw new Error('mailgun down'); });
        await adapter.sendTemplate({ to: 'a@b.co', templateKey: 'welcome' });
    });

    test('a critical delivery failure is thrown so the queue can retry', async () => {
        const adapter = adapterWith(async () => { throw new Error('mailgun down'); });
        await assert.rejects(adapter.sendTemplate({ to: 'a@b.co', templateKey: 'password_reset', critical: true }), /mailgun down/);
    });
});

describe('ProcessPasswordResetJob', () => {
    const setup = () => {
        stub(prisma.user, 'findUnique', async () => ({ id: 'u1', email: 'ana@empresa.com', first_name: 'Ana', is_active: true, company_id: null }));
        stub(prisma.passwordResetToken, 'updateMany', async () => ({ count: 0 }));
        const create = recorder(async () => ({}));
        stub(prisma.passwordResetToken, 'create', create);
        stub(prisma.securityEvent, 'create', async () => ({}));
        return { create };
    };

    test('sends the reset link as a critical email', async () => {
        const { create } = setup();
        const sendTemplate = recorder(async () => undefined);
        await new ProcessPasswordResetJob({ sendTemplate } as any).execute({ email: 'Ana@Empresa.com', ip: '10.0.0.1' });

        const message = sendTemplate.calls[0]![0];
        assert.equal(message.templateKey, 'password_reset');
        assert.equal(message.critical, true);
        assert.match(message.variables.reset_url, /\/reset-password\?token=[A-Za-z0-9_-]{43}$/);
        // only the hash is stored, never the token
        const token = message.variables.reset_url.split('token=')[1];
        assert.notEqual(create.calls[0]![0].data.token_hash, token);
        assert.equal(create.calls[0]![0].data.token_hash.length, 64);
    });

    test('a failed delivery makes the job fail so BullMQ retries it', async () => {
        setup();
        const emailService = { sendTemplate: async () => { throw new Error('mailgun down'); } };
        await assert.rejects(new ProcessPasswordResetJob(emailService as any).execute({ email: 'ana@empresa.com' }), /mailgun down/);
    });
});

describe('notifyTwoFactorChange', () => {
    test('sends the two_factor_changed template with the action', () => {
        const sendTemplate = recorder(async () => undefined);
        notifyTwoFactorChange({ sendTemplate } as any, { email: 'a@b.co', first_name: 'Ana' }, 'activado', '10.0.0.1');
        const message = sendTemplate.calls[0]![0];
        assert.equal(message.templateKey, 'two_factor_changed');
        assert.equal(message.variables.action, 'activado');
        assert.equal(message.variables.ip, '10.0.0.1');
    });

    test('a delivery failure never reaches the caller', async () => {
        const failing = { sendTemplate: () => Promise.reject(new Error('boom')) };
        notifyTwoFactorChange(failing as any, { email: 'a@b.co', first_name: 'Ana' }, 'desactivado');
        await new Promise((resolve) => setImmediate(resolve));
    });
});
