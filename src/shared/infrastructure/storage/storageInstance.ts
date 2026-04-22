import { S3StorageAdapter } from './S3StorageAdapter';

const region = process.env.S3_REGION || 'auto';
const endpoint = process.env.S3_ENDPOINT || '';
const accessKeyId = process.env.S3_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
const bucketName = process.env.S3_BUCKET_NAME || '';

if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    console.warn('⚠️ S3 Storage variables are not fully configured in the environment.');
}

export const storageService = new S3StorageAdapter(
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucketName
);
