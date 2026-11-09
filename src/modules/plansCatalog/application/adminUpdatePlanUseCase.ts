import { UseCase } from "../../../shared/application/useCase";
import { PlanRepository } from "../domain/repositories/plan.repository";
import { PrismaPlanRepository } from "../infrastructure/persistence/PrismaPlanRepository";
import { planFields } from "./planFields.schema";
import Joi from "joi";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminUpdatePlanUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        id: Joi.string().uuid().required(),
        data: Joi.object(planFields).required()
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
            throw new ApplicationError(404, "Plan not found", "NOT_FOUND", "NOT_FOUND");
        }
        // New companies are assigned the default plan, so it must stay active and default
        // until another plan takes over.
        if (existing.is_default && (data.is_active === false || data.is_default === false)) {
            throw new ApplicationError(400, "The default plan cannot be deactivated or unset; mark another plan as default first", "VALIDATION_ERROR", "VALIDATION");
        }
        if (data.is_default && (data.is_active === false || !existing.is_active)) {
            throw new ApplicationError(400, "Only an active plan can be the default", "VALIDATION_ERROR", "VALIDATION");
        }
        if (data.code && data.code !== existing.code && await this.planRepository.findByCode(data.code)) {
            throw new ApplicationError(409, "A plan with this code already exists", "VALIDATION_ERROR", "CONFLICT");
        }

        return await this.planRepository.update(id, data);
    }
}
