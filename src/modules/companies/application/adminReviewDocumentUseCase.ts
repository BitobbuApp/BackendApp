import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";
import Joi from "joi";
import { VerifDocStatus, VerificationStatus } from "@prisma/client";

export class AdminReviewDocumentUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        document_id: Joi.string().uuid().required(),
        status: Joi.string().valid('approved', 'rejected').required(),
        reviewer_id: Joi.string().uuid().required(),
        notes: Joi.string().allow('').optional()
    });
    protected outputSchema = Joi.any();

    private readonly verificationRepository: VerificationRepository;

    constructor(verificationRepository?: VerificationRepository) {
        super();
        this.verificationRepository = verificationRepository || new PrismaVerificationRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { document_id, status, reviewer_id, notes } = input;

        // 1. Update the document status
        const doc = await this.verificationRepository.updateDocumentStatus(document_id, status as VerifDocStatus, reviewer_id, notes);
        const companyId = doc.company_id;

        // 2. Business Logic: Re-evaluate company verification status
        if (status === 'rejected') {
            // If any document is rejected, the company is rejected
            await this.verificationRepository.updateCompanyVerificationStatus(companyId, 'rejected' as VerificationStatus, `Document rejected: ${notes || 'No reason provided'}`);
        } else {
            // If approved, check if ALL documents are now approved
            const summary = await this.verificationRepository.getVerificationSummary(companyId);
            
            if (summary.total_docs > 0 && summary.approved_docs === summary.total_docs) {
                await this.verificationRepository.updateCompanyVerificationStatus(companyId, 'verified' as VerificationStatus);
            } else {
                // Still under review if not all approved
                await this.verificationRepository.updateCompanyVerificationStatus(companyId, 'under_review' as VerificationStatus);
            }
        }

        return {
            document_id: doc.id,
            new_status: doc.status,
            company_id: doc.company_id
        };
    }
}
