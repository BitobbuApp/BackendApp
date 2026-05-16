import { UseCase } from '../../../shared/application/useCase';
import { SubscriptionRepository } from '../domain/repositories/subscription.repository';
import { PlanRepository } from '../domain/repositories/plan.repository';
import { PrismaSubscriptionRepository } from '../infrastructure/persistence/PrismaSubscriptionRepository';
import { PrismaPlanRepository } from '../infrastructure/persistence/PrismaPlanRepository';
import { ApplicationError } from '../../../shared/domain/error';
import Joi from 'joi';

interface CreateSubscriptionDTO {
    company_id: string;
    plan_id: string;
}

export class CreateSubscriptionUseCase extends UseCase<CreateSubscriptionDTO, any> {
    private readonly schema = Joi.object({
        company_id: Joi.string().uuid().required(),
        plan_id: Joi.string().uuid().required()
    });

    constructor(
        private readonly subscriptionRepo: SubscriptionRepository = new PrismaSubscriptionRepository(),
        private readonly planRepo: PlanRepository = new PrismaPlanRepository()
    ) {
        super();
    }

    protected inputSchema = this.schema;
    protected outputSchema = Joi.any();

    protected getValidationSchema(): Joi.ObjectSchema<CreateSubscriptionDTO> {
        return this.schema;
    }

    protected async implementation(data: CreateSubscriptionDTO): Promise<any> {
        const plan = await this.planRepo.findById(data.plan_id);
        if (!plan || !plan.is_active) {
            throw new ApplicationError(404, 'Subscription plan not found or inactive', 'NOT_FOUND', 'BUSINESS_RULE' as any);
        }

        // Deactivate existing active subscription
        await this.subscriptionRepo.deactivateActive(data.company_id);

        const now = new Date();
        const currentPeriodEnd = new Date(now.getTime() + plan.billing_cycle * 24 * 60 * 60 * 1000);

        let trialEndsAt = null;
        const hasHadTrial = await this.subscriptionRepo.hasHadTrial(data.company_id);

        if (plan.trial_days > 0 && !hasHadTrial) {
            trialEndsAt = new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000);
        }

        const subscription = await this.subscriptionRepo.create({
            company_id: data.company_id,
            plan_id: data.plan_id,
            amount: plan.price,
            current_period_start: now,
            current_period_end: currentPeriodEnd,
            trial_ends_at: trialEndsAt
        });

        return subscription;
    }
}
