import { ApplicationError } from '../../../../shared/domain/error';

export class SubscriptionExpiredError extends ApplicationError {
  constructor(message = 'Your subscription has expired.') {
    super(402, message, 'PAYMENT_REQUIRED' as any, 'BUSINESS_RULE' as any);
  }
}

export class TrialExpiredError extends ApplicationError {
  constructor(message = 'Your trial period has expired.') {
    super(402, message, 'PAYMENT_REQUIRED' as any, 'BUSINESS_RULE' as any);
  }
}

export class UsageLimitReachedError extends ApplicationError {
  constructor(message = 'You have reached the usage limit for your current subscription plan.') {
    super(402, message, 'PAYMENT_REQUIRED' as any, 'BUSINESS_RULE' as any);
  }
}
