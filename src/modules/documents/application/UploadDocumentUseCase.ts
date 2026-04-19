import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { StorageService } from '../../../shared/domain/storage/StorageService';
import { ApplicationError } from '../../../shared/domain/error';
import { randomUUID } from 'crypto';

interface UploadDocumentInput {
    tenantId: string;
    buffer: Buffer;
}

interface UploadDocumentOutput {
    fileKey: string;
    mimeType: string;
    extension: string;
}

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png'
]);

export class UploadDocumentUseCase extends UseCase<UploadDocumentInput, UploadDocumentOutput> {
    constructor(private readonly storageService: StorageService) {
        super();
    }

    protected inputSchema = Joi.object({
        tenantId: Joi.string().required(),
        buffer: Joi.any().required() // Validated manually inside
    });

    protected outputSchema = Joi.object({
        fileKey: Joi.string().required(),
        mimeType: Joi.string().required(),
        extension: Joi.string().required()
    });

    protected async implementation(data: UploadDocumentInput): Promise<UploadDocumentOutput> {
        const { tenantId, buffer } = data;

        if (!Buffer.isBuffer(buffer)) {
             throw new ApplicationError(400, 'Invalid file buffer provided', 'VALIDATION_ERROR', 'VALIDATION');
        }

        // Validate the file magic numbers securely
        const { fromBuffer } = await import('file-type');
        const fileTypeResult = await fromBuffer(buffer);

        if (!fileTypeResult || !ALLOWED_MIME_TYPES.has(fileTypeResult.mime)) {
             throw new ApplicationError(400, 'Invalid file type. Only PDF, JPEG, and PNG are allowed.', 'VALIDATION_ERROR', 'VALIDATION');
        }

        // Generate secure path: tenants/{tenantId}/documents/{uuid}.{verifiedExtension}
        const uuid = randomUUID();
        const verifiedExtension = fileTypeResult.ext;
        const fileKey = `tenants/${tenantId}/documents/${uuid}.${verifiedExtension}`;

        await this.storageService.uploadFile(buffer, fileKey, fileTypeResult.mime);

        return {
            fileKey,
            mimeType: fileTypeResult.mime,
            extension: verifiedExtension
        };
    }
}
