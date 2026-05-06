import { UseCase } from '../../../shared/application/useCase';
import { PlanRepository } from '../domain/repositories/plan.repository';
import { PrismaPlanRepository } from '../infrastructure/persistence/PrismaPlanRepository';
import Joi from 'joi';

interface GetSubscriptionPlanInput {
    is_default?: boolean;
    plan_name?: string;
    id?: string;
}

export class GetSubscriptionPlanUseCase extends UseCase<GetSubscriptionPlanInput, any> {
    protected inputSchema = Joi.object({
        is_default: Joi.boolean().optional(),
        plan_name: Joi.string().optional(),
        id: Joi.string().uuid().optional()
    }).min(1);

    protected outputSchema = Joi.any();

    private readonly planRepository: PlanRepository;

    constructor() {
        super();
        this.planRepository = new PrismaPlanRepository();
    }

    protected async implementation(data: GetSubscriptionPlanInput): Promise<any> {
        return await this.planRepository.findOne(data);
    }
}
