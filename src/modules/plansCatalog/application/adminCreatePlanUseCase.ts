import { UseCase } from "../../../shared/application/useCase";
import { PlanRepository } from "../domain/repositories/plan.repository";
import { PrismaPlanRepository } from "../infrastructure/persistence/PrismaPlanRepository";
import Joi from "joi";

export class AdminCreatePlanUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        billing_cycle: Joi.number().integer().min(1).required(),
        is_active: Joi.boolean().default(true)
    });
    protected outputSchema = Joi.any();

    private readonly planRepository: PlanRepository;

    constructor(planRepository?: PlanRepository) {
        super();
        this.planRepository = planRepository || new PrismaPlanRepository();
    }

    protected async implementation(input: any): Promise<any> {
        return await this.planRepository.create(input);
    }
}
