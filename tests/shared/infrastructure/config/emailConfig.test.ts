import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEmailConfig, emailConfigProblems } from '../../../../src/shared/infrastructure/config/emailConfig';
import { stubSettings, restoreAll } from '../../../helpers/stubs';

test('loadEmailConfig', async (t) => {
    t.afterEach(() => restoreAll());

    await t.test('returns the disabled defaults when email.enabled is not set', () => {
        const config = loadEmailConfig();
        assert.equal(config.enabled, false);
        assert.equal(config.fromAddress, 'no-reply@bitobbu.com');
    });

    await t.test('reports missing settings (without throwing) when enabled but incomplete', () => {
        stubSettings({ 'email.enabled': true });
        assert.deepEqual(emailConfigProblems(loadEmailConfig()), ['email.mailgun.api_key', 'email.mailgun.domain']);
    });

    await t.test('loads the values when enabled with everything set', () => {
        stubSettings({
            'email.enabled': true,
            'email.from_address': 'test@example.com',
            'email.mailgun.api_key': 'test_key',
            'email.mailgun.domain': 'test_domain',
        });
        const config = loadEmailConfig();
        assert.equal(config.enabled, true);
        assert.equal(config.fromAddress, 'test@example.com');
        assert.deepEqual(emailConfigProblems(config), []);
    });
});
