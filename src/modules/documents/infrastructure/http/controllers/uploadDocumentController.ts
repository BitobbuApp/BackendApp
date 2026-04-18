import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { StorageService } from '../../../../../shared/domain/storage/StorageService';
import { ApplicationError } from '../../../../../shared/domain/error';

// List of allowed MIME types based on magic number validation
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png'
]);

export class UploadDocumentController {
    constructor(private readonly storageService: StorageService) {}

    async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Fastify multipart handles the parsing
        const data = await request.file();

        if (!data) {
            throw new ApplicationError(400, 'No file uploaded', 'VALIDATION_ERROR', 'VALIDATION');
        }

        let buffer: Buffer;
        try {
            buffer = await data.toBuffer();
        } catch (error: any) {
            if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
                throw new ApplicationError(413, 'File too large. Maximum size is 5MB', 'VALIDATION_ERROR', 'VALIDATION');
            }
            throw error;
        }

        // Check if the file exceeded the 5MB limit configured in the fastify multipart plugin
        // (Just in case the exception isn't thrown but truncation flag is set)
        if (data.file.truncated) {
            throw new ApplicationError(413, 'File too large. Maximum size is 5MB', 'VALIDATION_ERROR', 'VALIDATION');
        }

        // Validate the file magic numbers securely
        const { fromBuffer } = await import('file-type');
        const fileTypeResult = await fromBuffer(buffer);

        if (!fileTypeResult || !ALLOWED_MIME_TYPES.has(fileTypeResult.mime)) {
             throw new ApplicationError(400, 'Invalid file type. Only PDF, JPEG, and PNG are allowed.', 'VALIDATION_ERROR', 'VALIDATION');
        }

        // Assume tenantId is available in request.user from authMiddleware
        const tenantId = (request as any).user?.companyId || 'default-tenant';

        // Generate secure path: tenants/{tenantId}/documents/{uuid}.{verifiedExtension}
        const uuid = randomUUID();
        const verifiedExtension = fileTypeResult.ext;
        const fileKey = `tenants/${tenantId}/documents/${uuid}.${verifiedExtension}`;

        await this.storageService.uploadFile(buffer, fileKey, fileTypeResult.mime);

        reply.status(200).send({
            success: true,
            data: {
                fileKey,
                mimeType: fileTypeResult.mime,
                extension: verifiedExtension
            }
        });
    }
}
