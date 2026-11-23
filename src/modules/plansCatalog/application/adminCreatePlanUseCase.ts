import { UseCase } from "../../../shared/application/useCase";
import { PlanRepository } from "../domain/repositories/plan.repository";
import { PrismaPlanRepository } from "../infrastructure/persistence/PrismaPlanRepository";
import { ApplicationError } from "../../../shared/domain/error";
import { planFields } from "./planFields.schema";
import Joi from "joi";

export class AdminCreatePlanUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        ...planFields,
        code: planFields.code.required(),
        name: planFields.name.required(),
        price: planFields.price.required(),
        billing_cycle: planFields.billing_cycle.required(),
        is_active: planFields.is_active.default(true)
    });
    protected outputSchema = Joi.any();

    private readonly planRepository: PlanRepository;

    constructor(planRepository?: PlanRepository) {
        super();
        this.planRepository = planRepository || new PrismaPlanRepository();
    }

    protected async implementation(input: any): Promise<any> {
        if (await this.planRepository.findByCode(input.code)) {
            throw new ApplicationError(409, "A plan with this code already exists", "VALIDATION_ERROR", "CONFLICT");
        }
        return await this.planRepository.create(input);
    }
}
