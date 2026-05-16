import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FastifyInstance } from 'fastify';
import { CreateRequestUseCase } from '../../../../src/modules/requests/application/createRequestUseCase';
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

describe('Integration: RFQ Creation Guard Constraints', () => {
    test('RFQ creation rejected when no active subscription exists', async () => {
        const repo = new MockSubscriptionRepository() as any;
        const guard = new SubscriptionGuardService(repo);
        await assert.rejects(
            guard.authorize('company_none', 'rfq'),
            SubscriptionExpiredError
        );
    });

    test('RFQ creation rejected when trial expired', async () => {
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

    test('RFQ creation rejected when limit reached', async () => {
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

    test('RFQ creation successful and counter incremented with valid subscription', async () => {
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
