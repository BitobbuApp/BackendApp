import { S3StorageAdapter } from './S3StorageAdapter';
import { StorageService } from '../../domain/storage/StorageService';
import { settings } from '../../../modules/settings/application/settingsService';
import logger from '../logger';

/**
 * Delegates to an S3 adapter built from the current storage settings.
 * The adapter is rebuilt only when one of the connection values changes, so credentials
 * edited from the BackOffice apply without restarting the process.
 */
class SettingsBackedStorageService implements StorageService {
    private adapter: S3StorageAdapter | null = null;
    private signature = '';

    private current(): S3StorageAdapter {
        const region = settings.get<string>('storage.s3.region') || 'auto';
        const endpoint = settings.get<string>('storage.s3.endpoint') || '';
        const accessKeyId = settings.get<string>('storage.s3.access_key_id') || '';
        const secretAccessKey = settings.get<string>('storage.s3.secret_access_key') || '';
        const bucketName = settings.get<string>('storage.s3.bucket') || '';

        const signature = [region, endpoint, accessKeyId, secretAccessKey, bucketName].join('|');
        if (!this.adapter || signature !== this.signature) {
            if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
                logger.warn('S3 storage settings are not fully configured');
            }
            this.adapter = new S3StorageAdapter(region, endpoint, accessKeyId, secretAccessKey, bucketName);
            this.signature = signature;
        }
        return this.adapter;
    }

    generateUploadPresignedUrl(tenantId: string, rfqId: string, originalFileName: string, mimeType: string) {
        return this.current().generateUploadPresignedUrl(tenantId, rfqId, originalFileName, mimeType);
    }
    generateDownloadPresignedUrl(fileKey: string) {
        return this.current().generateDownloadPresignedUrl(fileKey);
    }
    deleteDocument(fileKey: string) {
        return this.current().deleteDocument(fileKey);
    }
    uploadFile(buffer: Buffer, fileKey: string, mimeType: string) {
        return this.current().uploadFile(buffer, fileKey, mimeType);
    }
}

export const storageService: StorageService = new SettingsBackedStorageService();
