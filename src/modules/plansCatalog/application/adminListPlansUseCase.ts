import { UseCase } from "../../../shared/application/useCase";
import { PlanRepository } from "../domain/repositories/plan.repository";
import { PrismaPlanRepository } from "../infrastructure/persistence/PrismaPlanRepository";
import Joi from "joi";

export class AdminListPlansUseCase extends UseCase<any, any[]> {
    protected inputSchema = Joi.object({
        is_active: Joi.boolean().optional()
    });
    protected outputSchema = Joi.array();

    private readonly planRepository: PlanRepository;

    constructor(planRepository?: PlanRepository) {
        super();
        this.planRepository = planRepository || new PrismaPlanRepository();
    }

    protected async implementation(input: any): Promise<any[]> {
        return await this.planRepository.findAllAdmin(input);
    }
}
