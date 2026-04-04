import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import {
    completeOnboardingDtoRequestSchema,
    completeOnboardingDtoResponseSchema,
} from "./dtos/userOnboardingStatus.dto";
import { UserOnboardingStatusRepository } from "../domain/repositories/userOnboardingStatus.repository";
import { PrismaUserOnboardingStatusRepository } from "../infrastructure/persistence/PrismaUserOnboardingStatusRepository";

interface CompleteOnboardingInput {
    user_id: string;
    company_id: string;
    module_name: string;
}

export class CompleteOnboardingUseCase extends UseCase<CompleteOnboardingInput, any> {
    protected inputSchema: Joi.Schema = completeOnboardingDtoRequestSchema;
    protected outputSchema: Joi.Schema = completeOnboardingDtoResponseSchema;
    private readonly repository: UserOnboardingStatusRepository;

    constructor() {
        super();
        this.repository = new PrismaUserOnboardingStatusRepository();
    }

    protected async implementation(data: CompleteOnboardingInput): Promise<any> {
        return await this.repository.upsertModule(data.user_id, data.company_id, data.module_name);
    }
}
