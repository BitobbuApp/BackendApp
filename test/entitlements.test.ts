jest.mock('../src/shared/infrastructure/database', () => ({
    prisma: {
        subscription: { findFirst: jest.fn() },
        subscriptionPlan: { findFirst: jest.fn() },
        quoteResponse: { count: jest.fn() },
        companyOffer: { count: jest.fn() },
    },
}));
jest.mock('../src/shared/infrastructure/redis', () => ({ redisConnection: { publish: jest.fn(), duplicate: jest.fn() } }));
jest.mock('../src/shared/infrastructure/logger', () => ({ __esModule: true, default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

import { prisma } from '../src/shared/infrastructure/database';
import { settings } from '../src/modules/settings/application/settingsService';
import { EntitlementsService } from '../src/modules/subscriptions/application/entitlementsService';
import { monthRange, endOfZonedDay } from '../src/modules/subscriptions/application/planPeriod';

const db = prisma as any;
const DAY = 24 * 60 * 60 * 1000;

const free = { id: 'p-free', code: 'free', plan_name: 'Free', name_es: 'Gratis', price: 0, billing_cycle: 30, max_quotes_per_month: 5, max_active_offers: 1 };
const starter = { id: 'p-starter', code: 'starter', plan_name: 'Starter', name_es: 'Starter', price: 15.99, billing_cycle: 30, max_quotes_per_month: 50, max_active_offers: 10 };

function withSettings(values: Record<string, unknown>) {
    const original = settings.get.bind(settings);
    jest.spyOn(settings, 'get').mockImplementation(((key: string) => (key in values ? values[key] : original(key))) as any);
}

function subscription(plan: any, end: Date | null) {
    return { id: 's1', plan_id: plan.id, plan, status: 'active', current_period_start: new Date('2026-01-01'), current_period_end: end };
}

describe('planPeriod', () => {
    it('month range follows the business timezone (Caracas is UTC-4)', () => {
        // 2026-03-01 02:00 UTC is still Feb 28 in Caracas.
        const { start, end } = monthRange(new Date('2026-03-01T02:00:00Z'), 'America/Caracas');
        expect(start.toISOString()).toBe('2026-02-01T04:00:00.000Z');
        expect(end.toISOString()).toBe('2026-03-01T04:00:00.000Z');
    });

    it('end of a business day includes the whole day', () => {
        expect(endOfZonedDay('2026-12-31', 'America/Caracas')!.toISOString()).toBe('2027-01-01T04:00:00.000Z');
        expect(endOfZonedDay('', 'America/Caracas')).toBeNull();
        expect(endOfZonedDay('31/12/2026', 'America/Caracas')).toBeNull();
    });
});

describe('EntitlementsService', () => {
    const service = new EntitlementsService();
    const now = new Date('2026-06-15T15:00:00Z');

    beforeEach(() => {
        jest.restoreAllMocks();
        Object.values(db).forEach((model: any) => Object.values(model).forEach((fn: any) => fn.mockReset()));
        db.subscriptionPlan.findFirst.mockResolvedValue(free);
        db.quoteResponse.count.mockResolvedValue(0);
        db.companyOffer.count.mockResolvedValue(0);
    });

    it('free plan is unlimited until the configured business date', async () => {
        withSettings({ 'plans.free_unlimited_until': '2026-06-15' });
        db.subscription.findFirst.mockResolvedValue(subscription(free, null));
        const e = await service.get('c1', now);
        expect(e.limits).toEqual({ quotes_per_month: null, active_offers: null });
        expect(e.free_unlimited_until).not.toBeNull();
    });

    it('free plan gets its limits after the date', async () => {
        withSettings({ 'plans.free_unlimited_until': '2026-06-14' });
        db.subscription.findFirst.mockResolvedValue(subscription(free, null));
        const e = await service.get('c1', now);
        expect(e.limits).toEqual({ quotes_per_month: 5, active_offers: 1 });
        expect(e.free_unlimited_until).toBeNull();
    });

    it('the unlimited window never applies to paid plans', async () => {
        withSettings({ 'plans.free_unlimited_until': '2026-12-31' });
        db.subscription.findFirst.mockResolvedValue(subscription(starter, new Date(now.getTime() + 10 * DAY)));
        const e = await service.get('c1', now);
        expect(e.plan.code).toBe('starter');
        expect(e.limits.quotes_per_month).toBe(50);
    });

    it('a paid plan keeps working during the grace days', async () => {
        withSettings({ 'plans.grace_days': 3, 'plans.free_unlimited_until': '' });
        db.subscription.findFirst.mockResolvedValue(subscription(starter, new Date(now.getTime() - 2 * DAY)));
        const e = await service.get('c1', now);
        expect(e.plan.code).toBe('starter');
        expect(e.in_grace).toBe(true);
        expect(e.subscription!.status).toBe('grace');
    });

    it('a paid plan past the grace days behaves as free', async () => {
        withSettings({ 'plans.grace_days': 3, 'plans.free_unlimited_until': '' });
        db.subscription.findFirst.mockResolvedValue(subscription(starter, new Date(now.getTime() - 4 * DAY)));
        const e = await service.get('c1', now);
        expect(e.plan.code).toBe('free');
        expect(e.limits.quotes_per_month).toBe(5);
        expect(e.subscription).toBeNull();
    });

    it('a company without subscription falls back to the default plan', async () => {
        withSettings({ 'plans.free_unlimited_until': '' });
        db.subscription.findFirst.mockResolvedValue(null);
        const e = await service.get('c1', now);
        expect(e.plan.code).toBe('free');
    });

    it('assertCanPerform throws 402 at the limit and passes below it', async () => {
        withSettings({ 'plans.free_unlimited_until': '' });
        db.subscription.findFirst.mockResolvedValue(subscription(free, null));
        db.quoteResponse.count.mockResolvedValue(5);
        await expect(service.assertCanPerform('c1', 'quote', now)).rejects.toMatchObject({
            statusCode: 402, code: 'PLAN_LIMIT_REACHED', details: { operation: 'quote', limit: 5, used: 5, plan_code: 'free' },
        });
        db.companyOffer.count.mockResolvedValue(0);
        await expect(service.assertCanPerform('c1', 'offer', now)).resolves.toBeUndefined();
    });

    it('null limits mean unlimited', async () => {
        withSettings({ 'plans.free_unlimited_until': '' });
        db.subscription.findFirst.mockResolvedValue(subscription({ ...starter, max_quotes_per_month: null }, new Date(now.getTime() + DAY)));
        db.quoteResponse.count.mockResolvedValue(10_000);
        await expect(service.assertCanPerform('c1', 'quote', now)).resolves.toBeUndefined();
    });

    it('counts usage within the business month only', async () => {
        withSettings({ 'plans.free_unlimited_until': '' });
        db.subscription.findFirst.mockResolvedValue(subscription(free, null));
        await service.get('c1', now);
        const where = db.quoteResponse.count.mock.calls[0][0].where;
        expect(where.supplier_id).toBe('c1');
        expect(where.created_at.gte.toISOString()).toBe('2026-06-01T04:00:00.000Z');
        expect(where.created_at.lt.toISOString()).toBe('2026-07-01T04:00:00.000Z');
    });
});
