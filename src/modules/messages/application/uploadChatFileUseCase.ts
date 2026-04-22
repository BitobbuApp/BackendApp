import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { StorageService } from '../../../shared/domain/storage/StorageService';
import { UploadDocumentUseCase } from '../../documents/application/UploadDocumentUseCase';
import { ApplicationError } from '../../../shared/domain/error';

interface UploadChatFileInput {
    companyId: string;
    rawFiles: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
}

interface UploadChatFileOutput {
    file_url: string;
    file_name: string;
    mime_type: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const inputSchema = Joi.object({
    companyId: Joi.string().uuid().required(),
    rawFiles: Joi.array().min(1).required(),
}).options({ stripUnknown: true });

const outputSchema = Joi.object({
    file_url: Joi.string().required(),
    file_name: Joi.string().required(),
    mime_type: Joi.string().required(),
});

export class UploadChatFileUseCase extends UseCase<UploadChatFileInput, UploadChatFileOutput> {
    protected inputSchema = inputSchema;
    protected outputSchema = outputSchema;

    constructor(private readonly storageService: StorageService) {
        super();
    }

    protected async implementation(data: UploadChatFileInput): Promise<UploadChatFileOutput> {
        const file = data.rawFiles[0];

        // 1. Validate file size
        if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length > MAX_FILE_SIZE) {
            throw new ApplicationError(400, 'File exceeds the 5MB limit or is invalid.', 'VALIDATION_ERROR', 'VALIDATION');
        }

        // 2. Delegate upload + magic-byte validation to the existing UploadDocumentUseCase
        const uploadUseCase = new UploadDocumentUseCase(this.storageService);
        const result = await uploadUseCase.execute({
            tenantId: data.companyId,
            buffer: file.buffer,
        });

        // 3. Build the public URL
        const publicUrlBase = process.env.S3_PUBLIC_URL || '';
        const publicUrl = `${publicUrlBase}/${result.fileKey}`;

        return {
            file_url: publicUrl,
            file_name: file.file_name,
            mime_type: result.mimeType,
        };
    }
}
