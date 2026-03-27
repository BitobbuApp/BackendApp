import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaMessageRepository } from '../persistence/PrismaMessageRepository';
import { PrismaConversationRepository } from '../../../conversations/infrastructure/persistence/PrismaConversationRepository';
import { ListMessagesUseCase } from '../../application/listMessagesUseCase';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import Joi from 'joi';

const listMessagesQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(200).default(50),
    offset: Joi.number().integer().min(0).default(0)
});

export async function messageRoutes(app: FastifyInstance) {
    const messageRepository = new PrismaMessageRepository();
    const conversationRepository = new PrismaConversationRepository();
    const listMessagesUseCase = new ListMessagesUseCase(messageRepository, conversationRepository);

    app.get('/:conversationId', {
        preHandler: [authMiddleware] as any,
        preValidation: async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
            const { error } = listMessagesQuerySchema.validate(request.query);
            if (error) {
                return ApiResponse.error(reply, error.details?.[0]?.message || 'Validation error', 400);
            }
        }
    }, async (request: FastifyRequest<{ Params: { conversationId: string }, Querystring: any }>, reply: FastifyReply) => {
        try {
            const { conversationId } = request.params;
            const { limit, offset } = request.query as { limit: number, offset: number };
            const userId = (request as any).user.companyId || (request as any).user.userId;

            const messages = await listMessagesUseCase.execute({
                conversationId,
                userId,
                limit: Number(limit) || 50,
                offset: Number(offset) || 0
            });
            
            return ApiResponse.success(reply, messages, "Messages retrieved successfully", 200);
        } catch (error: any) {
            app.log.error(error);
            if (error.message === 'Conversation not found') return ApiResponse.error(reply, error.message, 404);
            if (error.message.includes('Forbidden')) return ApiResponse.error(reply, error.message, 403);
            return ApiResponse.error(reply, 'Internal Server Error', 500);
        }
    });
}
