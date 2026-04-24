import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { StorageService, UploadUrlResponse } from '../../domain/storage/StorageService';
import { StorageServiceException } from '../../domain/storage/StorageServiceException';

export class S3StorageAdapter implements StorageService {
    private client: S3Client;
    private bucketName: string;

    constructor(
        region: string,
        endpoint: string,
        accessKeyId: string,
        secretAccessKey: string,
        bucketName: string
    ) {
        this.bucketName = bucketName;
        this.client = new S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            // Required for some S3-compatible APIs like R2
            forcePathStyle: true,
        });
    }

    async generateUploadPresignedUrl(
        tenantId: string,
        rfqId: string,
        _originalFileName: string, // Kept for interface compatibility, but not used in key to prevent collisions
        mimeType: string
    ): Promise<UploadUrlResponse> {
        try {
            const uuid = randomUUID();
            // Construct the strictly defined S3 Key pattern: tenants/{tenantId}/rfqs/{rfqId}/{uuid}
            const fileKey = `tenants/${tenantId}/rfqs/${rfqId}/${uuid}`;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ContentType: mimeType,
            });

            // URL valid for 15 minutes (900 seconds)
            const presignedUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });

            return {
                presignedUrl,
                fileKey,
            };
        } catch (error) {
            throw new StorageServiceException('Failed to generate upload presigned URL', error);
        }
    }

    async generateDownloadPresignedUrl(fileKey: string): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
            });

            // URL valid for 15 minutes (900 seconds)
            const presignedUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });

            return presignedUrl;
        } catch (error) {
            throw new StorageServiceException('Failed to generate download presigned URL', error);
        }
    }

    async uploadFile(buffer: Buffer, fileKey: string, mimeType: string): Promise<void> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                Body: buffer,
                ContentType: mimeType,
            });

            await this.client.send(command);
        } catch (error) {
            throw new StorageServiceException('Failed to upload file to storage', error);
        }
    }

    async deleteDocument(fileKey: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
            });

            await this.client.send(command);
        } catch (error) {
            throw new StorageServiceException('Failed to delete document from storage', error);
        }
    }
}
