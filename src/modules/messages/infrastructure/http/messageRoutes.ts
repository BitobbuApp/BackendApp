import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ListMessagesUseCase } from '../../application/listMessagesUseCase';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';

import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';
import { UploadChatFileUseCase } from '../../application/uploadChatFileUseCase';
import { storageService } from '../../../../shared/infrastructure/storage/storageInstance';

export async function messageRoutes(app: FastifyInstance) {
    app.post('/upload', { preHandler: [authMiddleware, multipartParserMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UploadChatFileUseCase(storageService);
        const result = await useCase.execute({
            companyId: request.user.companyId,
            rawFiles: request.uploadedFiles || [],
        });
        return ApiResponse.success(reply, result, 'File uploaded');
    });

    app.get('/:conversationId', {
        preHandler: [authMiddleware] as any,
    }, async (request: FastifyRequest<{ Params: { conversationId: string }, Querystring: { limit?: string | number; offset?: string | number } }>, reply: FastifyReply) => {
        const useCase = new ListMessagesUseCase();
        const { conversationId } = request.params;
        const { limit, offset } = request.query;
        const companyId = (request as any).user.companyId || (request as any).user.userId;

        const messages = await useCase.execute({
            conversation_id: conversationId,
            requester_company_id: companyId,
            limit,
            offset
        });
        
        return ApiResponse.success(reply, messages, "Messages retrieved successfully", 200);
    });
}
