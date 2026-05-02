import { UseCase } from "../../../shared/application/useCase";
import { PlanRepository } from "../domain/repositories/plan.repository";
import { PrismaPlanRepository } from "../infrastructure/persistence/PrismaPlanRepository";
import Joi from "joi";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminUpdatePlanUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        id: Joi.string().uuid().required(),
        data: Joi.object({
            name: Joi.string().optional(),
            price: Joi.number().min(0).optional(),
            billing_cycle: Joi.number().integer().min(1).optional(),
            is_active: Joi.boolean().optional()
        }).required()
    });
    protected outputSchema = Joi.any();

    private readonly planRepository: PlanRepository;

    constructor(planRepository?: PlanRepository) {
        super();
        this.planRepository = planRepository || new PrismaPlanRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { id, data } = input;
        
        const existing = await this.planRepository.findById(id);
        if (!existing) {
            throw new ApplicationError(404, "Plan not found");
        }

        return await this.planRepository.update(id, data);
    }
}
