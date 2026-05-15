import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";
import Joi from "joi";

export class AdminListPendingVerificationsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        search: Joi.string().allow('').optional()
    });
    protected outputSchema = Joi.any();

    private readonly verificationRepository: VerificationRepository;

    constructor(verificationRepository?: VerificationRepository) {
        super();
        this.verificationRepository = verificationRepository || new PrismaVerificationRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { page, limit, search } = input;
        const { items, total } = await this.verificationRepository.listPendingVerifications({ page, limit, search });

        return {
            items,
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        };
    }
}
