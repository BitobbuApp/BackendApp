jest.mock('../src/shared/infrastructure/database', () => ({ prisma: { systemSetting: { findMany: jest.fn(), upsert: jest.fn() } } }));
jest.mock('../src/shared/infrastructure/redis', () => ({ redisConnection: { publish: jest.fn(), duplicate: jest.fn() } }));
jest.mock('../src/shared/infrastructure/logger', () => ({ __esModule: true, default: { error: jest.fn(), info: jest.fn() } }));

import { prisma } from '../src/shared/infrastructure/database';
import { SettingsService, maskSecret } from '../src/modules/settings/application/settingsService';

const findMany = prisma.systemSetting.findMany as jest.Mock;

describe('SettingsService', () => {
    afterEach(() => { delete process.env.EMAIL_FROM_NAME; findMany.mockReset(); });

    it('uses the registry default until the DB defines a value', async () => {
        const s = new SettingsService();
        findMany.mockResolvedValue([]);
        await s.reload();
        expect(s.get('email.from_name')).toBe('Bitobbu');
        process.env.EMAIL_FROM_NAME = 'IgnoredEnv';
        expect(s.get('email.from_name')).toBe('Bitobbu');
        findMany.mockResolvedValue([{ key: 'email.from_name', value: 'FromDb' }]);
        await s.reload();
        expect(s.get('email.from_name')).toBe('FromDb');
    });

    it('null in DB falls back to the default', async () => {
        const s = new SettingsService();
        findMany.mockResolvedValue([{ key: 'email.from_name', value: null }]);
        await s.reload();
        expect(s.get('email.from_name')).toBe('Bitobbu');
    });

    it('coerces types, bumps version and notifies on change', async () => {
        const s = new SettingsService();
        const spy = jest.fn();
        s.onChange(spy);
        findMany.mockResolvedValue([{ key: 'email.enabled', value: 'true' }]);
        await s.reload();
        expect(s.isEnabled('email.enabled')).toBe(true);
        expect(s.getVersion()).toBe(1);
        expect(spy).toHaveBeenCalledWith(['email.enabled']);
    });

    it('rejects unknown keys and masks secrets in list()', async () => {
        const s = new SettingsService();
        expect(() => s.get('nope')).toThrow();
        findMany.mockResolvedValue([{ key: 'telegram.bot_token', value: 'abcd1234' }]);
        await s.reload();
        const item = s.list('telegram').find((i) => i.key === 'telegram.bot_token')!;
        expect(item.value).toBe('••••1234');
        expect(maskSecret('')).toBeNull();
    });
});
