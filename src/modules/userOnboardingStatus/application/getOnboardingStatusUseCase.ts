import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { getOnboardingStatusDtoResponseSchema } from "./dtos/userOnboardingStatus.dto";
import { UserOnboardingStatusRepository } from "../domain/repositories/userOnboardingStatus.repository";
import { PrismaUserOnboardingStatusRepository } from "../infrastructure/persistence/PrismaUserOnboardingStatusRepository";

interface GetOnboardingStatusInput {
    user_id: string;
    company_id: string;
}

export class GetOnboardingStatusUseCase extends UseCase<GetOnboardingStatusInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        user_id: Joi.string().uuid().required(),
        company_id: Joi.string().uuid().required(),
    });
    protected outputSchema: Joi.Schema = getOnboardingStatusDtoResponseSchema;
    private readonly repository: UserOnboardingStatusRepository;

    constructor() {
        super();
        this.repository = new PrismaUserOnboardingStatusRepository();
    }

    protected async implementation(data: GetOnboardingStatusInput): Promise<any> {
        return await this.repository.findByUserAndCompany(data.user_id, data.company_id);
    }
}
