import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";
import Joi from "joi";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminGetCompanyDocumentsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.string().uuid().required();
    protected outputSchema = Joi.any();

    private readonly verificationRepository: VerificationRepository;

    constructor(verificationRepository?: VerificationRepository) {
        super();
        this.verificationRepository = verificationRepository || new PrismaVerificationRepository();
    }

    protected async implementation(companyId: string): Promise<any> {
        const documents = await this.verificationRepository.findDocumentsByCompanyId(companyId);
        return documents;
    }
}
