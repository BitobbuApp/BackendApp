import test from 'node:test';
import assert from 'node:assert/strict';
import { NodemailerBrevoEmailService } from '../../../../src/shared/infrastructure/notifications/nodemailerBrevoEmailService';
import { EmailMessage } from '../../../../src/shared/domain/notifications/emailMessage';

test('NodemailerBrevoEmailService', async (t) => {
    const originalEnv = process.env;

    await t.test('should instantiate without throwing when disabled', () => {
        process.env = { ...originalEnv, EMAIL_ENABLED: 'false' };
        const service = new NodemailerBrevoEmailService();
        assert.ok(service);
    });

    await t.test('sendTemplate should not throw when disabled', async () => {
        process.env = { ...originalEnv, EMAIL_ENABLED: 'false' };
        const service = new NodemailerBrevoEmailService();

        const message: EmailMessage = {
            to: 'test@example.com',
            templateKey: 'welcome'
        };

        // This should run without throwing since it will be a no-op
        await service.sendTemplate(message);
        assert.ok(true);
    });

    // Cleanup
    process.env = originalEnv;
});
