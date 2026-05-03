import { ISubscriptionGuard, ProtectedOperation } from './ports/subscription-guard.port';
import { SubscriptionRepository } from '../domain/repositories/subscription.repository';
import {
  SubscriptionExpiredError,
  TrialExpiredError,
  UsageLimitReachedError
} from '../domain/errors/subscription.errors';

export class SubscriptionGuardService implements ISubscriptionGuard {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async authorize(companyId: string, operation: ProtectedOperation, currentActiveOffersCount: number = 0): Promise<void> {
    const subscription = await this.subscriptionRepository.findActiveByCompanyId(companyId);

    if (!subscription) {
      throw new SubscriptionExpiredError('No active subscription found.');
    }

    const now = new Date();

    if (subscription.expires_at && new Date(subscription.expires_at) < now) {
      throw new SubscriptionExpiredError();
    }

    const plan = subscription.plan;

    if (subscription.trial_ends_at) {
      if (new Date(subscription.trial_ends_at) < now) {
        throw new TrialExpiredError();
      }
    }

    if (subscription.current_period_end && new Date(subscription.current_period_end) < now) {
       throw new SubscriptionExpiredError('Subscription period has ended.');
    }

    if (operation === 'rfq') {
      if (plan.max_rfq_per_month !== null && subscription.rfq_count_current >= plan.max_rfq_per_month) {
        throw new UsageLimitReachedError('RFQ limit reached.');
      }
    } else if (operation === 'quote') {
      if (plan.max_quotes_per_month !== null && subscription.quotes_count_current >= plan.max_quotes_per_month) {
        throw new UsageLimitReachedError('Quotes limit reached.');
      }
    } else if (operation === 'offer') {
       if (plan.max_active_offers !== null && currentActiveOffersCount >= plan.max_active_offers) {
           throw new UsageLimitReachedError('Active offers limit reached.');
       }
    }
  }

  async incrementUsage(companyId: string, operation: ProtectedOperation): Promise<void> {
    if (operation === 'offer') return; // Active offers are counted dynamically, not incremented

    const subscription = await this.subscriptionRepository.findActiveByCompanyId(companyId);
    if (!subscription) return;

    if (operation === 'rfq') {
      await this.subscriptionRepository.update(subscription.id, {
        rfq_count_current: subscription.rfq_count_current + 1
      });
    } else if (operation === 'quote') {
      await this.subscriptionRepository.update(subscription.id, {
        quotes_count_current: subscription.quotes_count_current + 1
      });
    }
  }
}
