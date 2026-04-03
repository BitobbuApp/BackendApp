import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ListUserConversationsUseCase } from '../../application/listUserConversationsUseCase';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';

export async function conversationRoutes(app: FastifyInstance) {
    app.get('/', {
        preHandler: [authMiddleware] as any,
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new ListUserConversationsUseCase();
        const companyId = (request as any).user.companyId || (request as any).user.userId;
        const conversations = await useCase.execute({ company_id: companyId });
        return ApiResponse.success(reply, conversations, "Conversations retrieved successfully", 200);
    });
}
