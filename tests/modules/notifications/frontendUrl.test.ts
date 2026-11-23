import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { stubSettings, restoreAll } from '../../helpers/stubs';
import { stubSettings, restoreAll } from '../../helpers/stubs';
import { getFrontendUrl } from '../../../src/shared/application/services/frontendUrl';

const savedEnv = process.env.NODE_ENV;
afterEach(() => {
    restoreAll();
    process.env.NODE_ENV = savedEnv;
});

describe('getFrontendUrl', () => {
    test('uses app.frontend_url without a trailing slash', () => {
        stubSettings({ 'app.frontend_url': 'https://app.bitobbu.com/' });
        assert.equal(getFrontendUrl(), 'https://app.bitobbu.com');
    });

    test('in production a missing FRONTEND_URL is an error, not localhost', () => {
                process.env.NODE_ENV = 'production';
        assert.throws(() => getFrontendUrl(), /FRONTEND_URL is required/);
    });

    test('outside production it falls back to the local dev server', () => {
                process.env.NODE_ENV = 'development';
        assert.equal(getFrontendUrl(), 'http://localhost:5173');
    });
});
