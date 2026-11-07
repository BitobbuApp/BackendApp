import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getFrontendUrl } from '../../../src/shared/application/services/frontendUrl';

const saved = { url: process.env.FRONTEND_URL, env: process.env.NODE_ENV };
afterEach(() => {
    if (saved.url === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = saved.url;
    process.env.NODE_ENV = saved.env;
});

describe('getFrontendUrl', () => {
    test('uses FRONTEND_URL without a trailing slash', () => {
        process.env.FRONTEND_URL = 'https://app.bitobbu.com/';
        assert.equal(getFrontendUrl(), 'https://app.bitobbu.com');
    });

    test('in production a missing FRONTEND_URL is an error, not localhost', () => {
        delete process.env.FRONTEND_URL;
        process.env.NODE_ENV = 'production';
        assert.throws(() => getFrontendUrl(), /FRONTEND_URL is required/);
    });

    test('outside production it falls back to the local dev server', () => {
        delete process.env.FRONTEND_URL;
        process.env.NODE_ENV = 'development';
        assert.equal(getFrontendUrl(), 'http://localhost:5173');
    });
});
