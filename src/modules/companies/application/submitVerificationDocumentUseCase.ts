import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { submitDocumentDtoRequestSchema, documentDtoResponseSchema } from "./dtos/verification.dto";
import Joi from "joi";
import { VerificationDocument, VerifDocType } from "../domain/entities/verification.entity";

interface SubmitDocumentInput {
    company_id: string;
    type: VerifDocType;
    file_url: string;
}

import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";

export class SubmitVerificationDocumentUseCase extends UseCase<SubmitDocumentInput, VerificationDocument> {
    protected inputSchema: Joi.Schema = submitDocumentDtoRequestSchema;
    protected outputSchema: Joi.Schema = documentDtoResponseSchema;
    private readonly verificationRepository: VerificationRepository;

    constructor() {
        super();
        this.verificationRepository = new PrismaVerificationRepository();
    }

    protected async implementation(data: SubmitDocumentInput): Promise<VerificationDocument> {
        // Al subir un documento, actualizamos el estado de la verificación general
        await this.verificationRepository.upsertVerification({
            company_id: data.company_id,
            status: 'Under_Review',
            last_submission_at: new Date()
        });

        return this.verificationRepository.addDocument(data);
    }
}
