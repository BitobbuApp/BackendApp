import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEmailConfig } from '../../../../src/shared/infrastructure/config/emailConfig';

test('loadEmailConfig', async (t) => {
    const originalEnv = process.env;

    await t.test('should return default disabled config when EMAIL_ENABLED is not true', () => {
        process.env = { ...originalEnv, EMAIL_ENABLED: 'false' };
        const config = loadEmailConfig();
        assert.equal(config.enabled, false);
        assert.equal(config.fromAddress, 'no-reply@bitobbu.com');
    });

    await t.test('should fail fast if EMAIL_ENABLED=true but required vars missing', () => {
        process.env = { ...originalEnv, EMAIL_ENABLED: 'true' };
        assert.throws(() => loadEmailConfig(), /Email service is enabled but missing required environment variables/);
    });

    await t.test('should load correctly when enabled with all vars', () => {
        process.env = {
            ...originalEnv,
            EMAIL_ENABLED: 'true',
            EMAIL_BREVO_SMTP_HOST: 'smtp.test.com',
            EMAIL_BREVO_SMTP_USER: 'user',
            EMAIL_BREVO_SMTP_PASS: 'pass',
            EMAIL_FROM_ADDRESS: 'test@example.com'
        };
        const config = loadEmailConfig();
        assert.equal(config.enabled, true);
        assert.equal(config.smtp.host, 'smtp.test.com');
        assert.equal(config.smtp.user, 'user');
        assert.equal(config.smtp.pass, 'pass');
        assert.equal(config.fromAddress, 'test@example.com');
    });

    // Cleanup
    process.env = originalEnv;
});
