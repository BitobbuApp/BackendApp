import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { verificationDtoResponseSchema } from "./dtos/verification.dto";
import Joi from "joi";
import { CompanyVerification } from "../domain/entities/verification.entity";

import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";

export class GetVerificationStatusUseCase extends UseCase<string, CompanyVerification> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = verificationDtoResponseSchema;
    private readonly verificationRepository: VerificationRepository;

    constructor() {
        super();
        this.verificationRepository = new PrismaVerificationRepository();
    }

    protected async implementation(companyId: string): Promise<CompanyVerification> {
        const verification = await this.verificationRepository.getVerification(companyId);
        if (!verification) {
            return new CompanyVerification(companyId);
        }
        return verification;
    }
}
