jest.mock('../src/shared/infrastructure/database', () => ({ prisma: { systemSetting: { findMany: jest.fn(), upsert: jest.fn((args) => args) }, $transaction: jest.fn(async (ops) => ops) } }));
jest.mock('../src/shared/infrastructure/redis', () => ({ redisConnection: { publish: jest.fn(), duplicate: jest.fn() } }));
jest.mock('../src/shared/infrastructure/logger', () => ({ __esModule: true, default: { error: jest.fn(), info: jest.fn() } }));

import { prisma } from '../src/shared/infrastructure/database';
import { SettingsService, SettingsValidationError, maskSecret } from '../src/modules/settings/application/settingsService';

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

    it('setMany writes every value in one transaction', async () => {
        const s = new SettingsService();
        findMany.mockResolvedValue([]);
        const keys = await s.setMany({ 'email.enabled': 'true', 'plans.grace_days': '5' }, 'admin-1');
        expect(keys).toEqual(['email.enabled', 'plans.grace_days']);
        const ops = (prisma.$transaction as jest.Mock).mock.calls[0][0];
        expect(ops).toHaveLength(2);
        expect(ops[0].update.value).toBe(true);
        expect(ops[1].update.value).toBe(5);
    });

    it('setMany is all-or-nothing and reports every invalid field', async () => {
        const s = new SettingsService();
        (prisma.$transaction as jest.Mock).mockClear();
        const attempt = s.setMany({ 'plans.grace_days': 'abc', 'plans.free_unlimited_until': '31/12/2026', 'nope': 1 });
        await expect(attempt).rejects.toBeInstanceOf(SettingsValidationError);
        await attempt.catch((e: SettingsValidationError) => expect(e.errors).toHaveLength(3));
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
