import { FastifyInstance } from 'fastify';
import { UploadDocumentController } from '../controllers/uploadDocumentController';
import { S3StorageAdapter } from '../../../../../shared/infrastructure/storage/S3StorageAdapter';
import { authMiddleware } from '../../../../../shared/infrastructure/http/middlewares/authMiddleware';

export async function documentRoutes(fastify: FastifyInstance) {
    // In a real application, these should be injected or pulled from an IoC container
    // and environment variables should be validated elsewhere.
    const storageService = new S3StorageAdapter(
        process.env.S3_REGION || 'us-east-1',
        process.env.S3_ENDPOINT || 'http://localhost:9000',
        process.env.S3_ACCESS_KEY_ID || 'testKey',
        process.env.S3_SECRET_ACCESS_KEY || 'testSecret',
        process.env.S3_BUCKET_NAME || 'testBucket'
    );
    const controller = new UploadDocumentController(storageService);

    fastify.post('/upload', { preHandler: [authMiddleware] as any }, async (request, reply) => {
        return controller.handle(request, reply);
    });
}
