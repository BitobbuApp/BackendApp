import { UseCase } from "../../../shared/application/useCase";
import { VerificationRepository } from "../domain/repositories/verification.repository";
import { documentDtoResponseSchema } from "./dtos/verification.dto";
import Joi from "joi";
import { VerificationDocument } from "../domain/entities/verification.entity";
import { PrismaVerificationRepository } from "../infrastructure/persistence/PrismaVerificationRepository";
import { UploadDocumentUseCase } from "../../documents/application/UploadDocumentUseCase";
import { storageService } from "../../../shared/infrastructure/storage/storageInstance";
import { ApplicationError } from "../../../shared/domain/error";

interface SubmitDocumentInput {
    company_id: string;
    type_id: number;
    rawFiles: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
}

export class SubmitVerificationDocumentUseCase extends UseCase<SubmitDocumentInput, VerificationDocument> {
    protected inputSchema: Joi.Schema = Joi.object({
        company_id: Joi.string().uuid().required(),
        type_id: Joi.number().integer().required(),
        rawFiles: Joi.array().min(1).required()
    }).options({ stripUnknown: true });
    
    protected outputSchema: Joi.Schema = documentDtoResponseSchema;
    private readonly verificationRepository: VerificationRepository;

    constructor() {
        super();
        this.verificationRepository = new PrismaVerificationRepository();
    }

    protected async implementation(data: SubmitDocumentInput): Promise<VerificationDocument> {
        const file = data.rawFiles[0];

        if (!file || !file.buffer) {
            throw new ApplicationError(400, "A valid file is required", "VALIDATION_ERROR", "VALIDATION");
        }

        const uploadUseCase = new UploadDocumentUseCase(storageService);
        const result = await uploadUseCase.execute({
            tenantId: data.company_id,
            buffer: file.buffer
        });

        const publicUrlBase = process.env.S3_PUBLIC_URL || '';
        const fileUrl = `${publicUrlBase}/${result.fileKey}`;

        // Al subir un documento, actualizamos el estado de la verificación general
        await this.verificationRepository.upsertVerification({
            company_id: data.company_id,
            status: 'under_review',
            last_submission_at: new Date()
        });

        // Check if there is an existing document for this type
        const documents = await this.verificationRepository.getDocuments(data.company_id);
        const existingDoc = documents.find(d => d.type_id === data.type_id);

        if (existingDoc) {
            if (existingDoc.status === 'approved' || existingDoc.status === 'pending') {
                throw new ApplicationError(400, "Ya existe un documento aprobado o pendiente para este tipo.", "VERIFICATION_ERROR");
            }
            // Update existing (this gracefully sets it to pending, clears notes, drops reviewed_by/reviewed_at)
            return this.verificationRepository.updateDocument(existingDoc.id, {
                file_url: fileUrl,
                status: 'pending',
                feedback: null,
                reviewed_by: null
            });
        }

        return this.verificationRepository.addDocument({
            company_id: data.company_id,
            type_id: data.type_id,
            file_url: fileUrl
        });
    }
}
