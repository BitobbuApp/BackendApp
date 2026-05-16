import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SubscriptionGuardService } from '../../../../src/modules/subscriptions/application/subscription-guard.service';
import { SubscriptionExpiredError, TrialExpiredError, UsageLimitReachedError } from '../../../../src/modules/subscriptions/domain/errors/subscription.errors';

class MockSubscriptionRepository {
    public subscription: any = null;
    public updateCalls: any[] = [];

    async findActiveByCompanyId(companyId: string): Promise<any | null> {
        return this.subscription;
    }

    async update(id: string, data: any): Promise<any> {
        this.updateCalls.push({ id, data });
        return { ...this.subscription, ...data };
    }
}

describe('SubscriptionGuardService', () => {
    test('should throw SubscriptionExpiredError if no active subscription found', async () => {
        const repo = new MockSubscriptionRepository() as any;
        const guard = new SubscriptionGuardService(repo);
        await assert.rejects(
            guard.authorize('company1', 'rfq'),
            SubscriptionExpiredError
        );
    });

    test('should throw SubscriptionExpiredError if subscription is expired', async () => {
        const repo = new MockSubscriptionRepository() as any;
        repo.subscription = {
            id: 'sub1',
            company_id: 'company1',
            expires_at: new Date(Date.now() - 10000), // expired
            plan: { max_rfq_per_month: 10 }
        };
        const guard = new SubscriptionGuardService(repo);
        await assert.rejects(
            guard.authorize('company1', 'rfq'),
            SubscriptionExpiredError
        );
    });

    test('should throw TrialExpiredError if trial has ended', async () => {
        const repo = new MockSubscriptionRepository() as any;
        repo.subscription = {
            id: 'sub1',
            company_id: 'company1',
            expires_at: null,
            trial_ends_at: new Date(Date.now() - 10000), // expired trial
            plan: { max_rfq_per_month: 10 }
        };
        const guard = new SubscriptionGuardService(repo);
        await assert.rejects(
            guard.authorize('company1', 'rfq'),
            TrialExpiredError
        );
    });

    test('should throw UsageLimitReachedError if rfq limit is reached', async () => {
        const repo = new MockSubscriptionRepository() as any;
        repo.subscription = {
            id: 'sub1',
            company_id: 'company1',
            expires_at: null,
            trial_ends_at: null,
            rfq_count_current: 10,
            plan: { max_rfq_per_month: 10 }
        };
        const guard = new SubscriptionGuardService(repo);
        await assert.rejects(
            guard.authorize('company1', 'rfq'),
            UsageLimitReachedError
        );
    });

    test('should update counter if rfq limit is not reached', async () => {
        const repo = new MockSubscriptionRepository() as any;
        repo.subscription = {
            id: 'sub1',
            company_id: 'company1',
            expires_at: null,
            trial_ends_at: null,
            rfq_count_current: 5,
            current_period_end: new Date(Date.now() + 10000),
            plan: { max_rfq_per_month: 10 }
        };
        const guard = new SubscriptionGuardService(repo);
        await guard.authorize('company1', 'rfq');
        await guard.incrementUsage('company1', 'rfq');
        assert.equal(repo.updateCalls.length, 1);
        assert.equal(repo.updateCalls[0].data.rfq_count_current, 6);
    });
});
