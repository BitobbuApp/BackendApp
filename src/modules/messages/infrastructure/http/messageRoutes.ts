import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ListMessagesUseCase } from '../../application/listMessagesUseCase';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';

export async function messageRoutes(app: FastifyInstance) {
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
