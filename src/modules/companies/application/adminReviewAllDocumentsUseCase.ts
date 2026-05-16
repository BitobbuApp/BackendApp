import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";
import Joi from "joi";
import { VerifDocStatus, VerificationStatus } from "@prisma/client";

export class AdminReviewAllDocumentsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        company_id: Joi.string().uuid().required(),
        action: Joi.string().valid('approve_all', 'reject_all').required(),
        reviewer_id: Joi.string().uuid().required(),
        reason: Joi.string().allow('').optional()
    });
    protected outputSchema = Joi.any();

    private readonly verificationRepository: VerificationRepository;

    constructor(verificationRepository?: VerificationRepository) {
        super();
        this.verificationRepository = verificationRepository || new PrismaVerificationRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { company_id, action, reviewer_id, reason } = input;

        const docs = await this.verificationRepository.findDocumentsByCompanyId(company_id);
        const status = action === 'approve_all' ? 'approved' : 'rejected';

        // Update all documents
        await Promise.all(docs.map(doc => 
            this.verificationRepository.updateDocumentStatus(doc.id, status as VerifDocStatus, reviewer_id, reason)
        ));

        // Update company status
        const companyStatus = action === 'approve_all' ? 'verified' : 'rejected';
        await this.verificationRepository.updateCompanyVerificationStatus(company_id, companyStatus as VerificationStatus, reason);

        return {
            company_id,
            action,
            documents_affected: docs.length,
            new_company_status: companyStatus
        };
    }
}
